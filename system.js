import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Gvc from 'gi://Gvc';

const NM_NAME = 'org.freedesktop.NetworkManager';
const NM_PATH = '/org/freedesktop/NetworkManager';
const NM_IFACE = 'org.freedesktop.NetworkManager';
const BLUEZ_NAME = 'org.bluez';
const BLUEZ_ROOT = '/';
const BLUEZ_ADAPTER = 'org.bluez.Adapter1';
function unpackBoolean(variant) {
    return variant ? variant.deep_unpack() : null;
}

function setProperty(proxy, interfaceName, propertyName, variant) {
    if (!proxy)
        return;

    const parameters = new GLib.Variant('(ssv)', [
        interfaceName,
        propertyName,
        variant,
    ]);

    proxy.call(
        'org.freedesktop.DBus.Properties.Set',
        parameters,
        Gio.DBusCallFlags.NONE,
        -1,
        null,
        (source, result) => {
            try {
                source.call_finish(result);
            } catch (error) {
                logError(error, `Unable to set ${interfaceName}.${propertyName}`);
            }
        }
    );
}

function setBooleanProperty(proxy, interfaceName, propertyName, value) {
    setProperty(proxy, interfaceName, propertyName, new GLib.Variant('b', value));
}

/**
 * Owns the system-facing part of the Control Center.
 *
 * UI actors remain in extension.js. This object only observes and changes
 * system state, and releases every signal/proxy it owns in destroy().
 */
export class SystemController {
    constructor(onStateChanged = () => {}) {
        this._onStateChanged = onStateChanged;
        this._signals = [];
        this._state = {
            brightnessAvailable: false,
            brightness: 0.65,
            wifiAvailable: false,
            wifiEnabled: false,
            bluetoothAvailable: false,
            bluetoothEnabled: false,
            focusEnabled: false,
            volume: 0,
            muted: false,
            audioAvailable: false,
        };

        this._initFocus();
        this._initBrightness();
        this._initNetworkManager();
        this._initBluetooth();
        this._initAudio();
    }

    get state() {
        return {...this._state};
    }

    _emit() {
        this._onStateChanged(this.state);
    }

    _initFocus() {
        try {
            this._notifications = new Gio.Settings({
                schema_id: 'org.gnome.desktop.notifications',
            });
            this._state.focusEnabled =
                !this._notifications.get_boolean('show-banners');
            this._signals.push([
                this._notifications,
                this._notifications.connect('changed::show-banners', () => {
                    this._state.focusEnabled =
                        !this._notifications.get_boolean('show-banners');
                    this._emit();
                }),
            ]);
        } catch (error) {
            logError(error, 'Do Not Disturb settings are unavailable');
        }
    }

    toggleFocus() {
        if (!this._notifications)
            return;

        this._notifications.set_boolean(
            'show-banners',
            this._notifications.get_boolean('show-banners') === false
        );
    }

    _initBrightness() {
        try {
            this._brightness = Gio.DBusProxy.new_for_bus_sync(
                Gio.BusType.SESSION,
                Gio.DBusProxyFlags.NONE,
                null,
                'org.gnome.Shell.Brightness',
                '/org/gnome/Shell/Brightness',
                'org.gnome.Shell.Brightness',
                null
            );
            this._refreshBrightness();
            this._signals.push([
                this._brightness,
                this._brightness.connect('g-properties-changed', () => this._refreshBrightness()),
            ]);
        } catch (error) {
            logError(error, 'GNOME Shell brightness control is unavailable');
        }
    }

    _refreshBrightness() {
        if (!this._brightness)
            return;

        this._state.brightnessAvailable = Boolean(unpackBoolean(
            this._brightness.get_cached_property('HasBrightnessControl')
        ));
        const value = this._brightness.get_cached_property('Brightness');
        if (value)
            this._state.brightness = Math.max(0, Math.min(1, value.deep_unpack()));
        this._emit();
    }

    setBrightness(value) {
        if (!this._brightness || !this._state.brightnessAvailable)
            return;

        setProperty(
            this._brightness,
            'org.gnome.Shell.Brightness',
            'Brightness',
            new GLib.Variant('d', Math.max(0, Math.min(1, value)))
        );
    }

    _initNetworkManager() {
        try {
            this._network = Gio.DBusProxy.new_for_bus_sync(
                Gio.BusType.SYSTEM,
                Gio.DBusProxyFlags.NONE,
                null,
                NM_NAME,
                NM_PATH,
                NM_IFACE,
                null
            );

            this._state.wifiAvailable = true;
            this._refreshWifi();
            this._signals.push([
                this._network,
                this._network.connect('g-properties-changed', () => {
                    this._refreshWifi();
                }),
            ]);
        } catch (error) {
            logError(error, 'NetworkManager is unavailable');
        }
    }

    _refreshWifi() {
        if (!this._network)
            return;

        const enabled = unpackBoolean(
            this._network.get_cached_property('WirelessEnabled')
        );
        if (enabled === null)
            return;

        this._state.wifiEnabled = enabled;
        this._emit();
    }

    toggleWifi() {
        if (!this._network)
            return;

        setBooleanProperty(
            this._network,
            NM_IFACE,
            'WirelessEnabled',
            !this._state.wifiEnabled
        );
    }

    _initBluetooth() {
        try {
            this._bluezManager = Gio.DBusObjectManagerClient.new_for_bus_sync(
                Gio.BusType.SYSTEM,
                Gio.DBusObjectManagerClientFlags.DO_NOT_AUTO_START,
                BLUEZ_NAME,
                BLUEZ_ROOT,
                null,
                null,
                null
            );

            this._signals.push([
                this._bluezManager,
                this._bluezManager.connect('object-added', () => this._findBluetoothAdapter()),
            ]);
            this._signals.push([
                this._bluezManager,
                this._bluezManager.connect('object-removed', () => this._findBluetoothAdapter()),
            ]);
            this._findBluetoothAdapter();
        } catch (error) {
            logError(error, 'BlueZ is unavailable');
        }
    }

    _findBluetoothAdapter() {
        let adapter = null;

        for (const object of this._bluezManager?.get_objects() ?? []) {
            const candidate = object.get_interface(BLUEZ_ADAPTER);
            if (candidate) {
                adapter = candidate;
                break;
            }
        }

        if (adapter === this._bluetoothAdapter)
            return;

        if (this._bluetoothAdapter && this._bluetoothSignal) {
            this._bluetoothAdapter.disconnect(this._bluetoothSignal);
            this._bluetoothSignal = 0;
        }

        this._bluetoothAdapter = adapter;
        this._state.bluetoothAvailable = Boolean(adapter);

        if (adapter) {
            this._bluetoothSignal = adapter.connect(
                'g-properties-changed',
                () => this._refreshBluetooth()
            );
            this._refreshBluetooth();
        } else {
            this._state.bluetoothEnabled = false;
            this._emit();
        }
    }

    _refreshBluetooth() {
        if (!this._bluetoothAdapter)
            return;

        this._state.bluetoothEnabled = Boolean(unpackBoolean(
            this._bluetoothAdapter.get_cached_property('Powered')
        ));
        this._emit();
    }

    toggleBluetooth() {
        if (!this._bluetoothAdapter)
            return;

        setBooleanProperty(
            this._bluetoothAdapter,
            BLUEZ_ADAPTER,
            'Powered',
            !this._state.bluetoothEnabled
        );
    }

    _initAudio() {
        try {
            this._mixer = new Gvc.MixerControl({
                name: 'Control Center',
            });

            this._signals.push([
                this._mixer,
                this._mixer.connect('state-changed', () => this._refreshAudio()),
            ]);
            this._signals.push([
                this._mixer,
                this._mixer.connect('default-sink-changed', () => this._watchSink()),
            ]);
            this._mixer.open();
        } catch (error) {
            logError(error, 'GVC audio control is unavailable');
        }
    }

    _refreshAudio() {
        if (!this._mixer ||
            this._mixer.get_state() !== Gvc.MixerControlState.READY)
            return;

        this._state.audioAvailable = true;
        this._watchSink();
    }

    _watchSink() {
        if (!this._mixer ||
            this._mixer.get_state() !== Gvc.MixerControlState.READY)
            return;

        const sink = this._mixer.get_default_sink();
        if (!sink) {
            this._state.audioAvailable = false;
            this._emit();
            return;
        }

        if (this._sink && this._sinkSignals) {
            for (const id of this._sinkSignals)
                this._sink.disconnect(id);
        }

        this._sink = sink;
        this._sinkSignals = [
            sink.connect('notify::volume', () => this._readSink()),
            sink.connect('notify::is-muted', () => this._readSink()),
        ];
        this._readSink();
    }

    _readSink() {
        if (!this._sink || !this._mixer)
            return;

        const max = this._mixer.get_vol_max_norm();
        this._state.volume = max > 0
            ? Math.max(0, Math.min(1, this._sink.get_volume() / max))
            : 0;
        this._state.muted = this._sink.get_is_muted();
        this._emit();
    }

    setVolume(value) {
        if (!this._sink || !this._mixer)
            return;

        const normalized = Math.max(0, Math.min(1, value));
        this._sink.volume = normalized * this._mixer.get_vol_max_norm();
        this._sink.push_volume();
    }

    toggleMute() {
        if (!this._sink)
            return;

        this._sink.change_is_muted(!this._sink.get_is_muted());
    }

    destroy() {
        for (const [object, id] of this._signals) {
            try {
                object.disconnect(id);
            } catch {
                // The proxy or settings object may already have been disposed.
            }
        }
        this._signals = [];

        if (this._bluetoothAdapter && this._bluetoothSignal) {
            this._bluetoothAdapter.disconnect(this._bluetoothSignal);
            this._bluetoothSignal = 0;
        }

        if (this._sink && this._sinkSignals) {
            for (const id of this._sinkSignals)
                this._sink.disconnect(id);
        }
        this._sinkSignals = [];

        this._mixer?.close();
        this._mixer = null;
        this._sink = null;
        this._network = null;
        this._brightness = null;
        this._bluezManager = null;
        this._notifications = null;
    }
}
