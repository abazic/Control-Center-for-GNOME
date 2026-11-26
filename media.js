import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

const DBUS_NAME = 'org.freedesktop.DBus';
const DBUS_PATH = '/org/freedesktop/DBus';
const DBUS_IFACE = 'org.freedesktop.DBus';
const PLAYER_PATH = '/org/mpris/MediaPlayer2';
const PLAYER_IFACE = 'org.mpris.MediaPlayer2.Player';

function unpack(value) {
    return value && typeof value.deep_unpack === 'function'
        ? value.deep_unpack() : (value ?? null);
}

function callPlayer(proxy, method) {
    if (!proxy)
        return;

    proxy.call(method, null, Gio.DBusCallFlags.NONE, -1, null, (source, result) => {
        try {
            source.call_finish(result);
        } catch (error) {
            logError(error, `MPRIS ${method} failed`);
        }
    });
}

/** Tracks the active MPRIS player on the session bus. */
export class MediaController {
    constructor(onStateChanged = () => {}) {
        this._onStateChanged = onStateChanged;
        this._connection = Gio.bus_get_sync(Gio.BusType.SESSION, null);
        this._dbus = Gio.DBusProxy.new_sync(
            this._connection, Gio.DBusProxyFlags.NONE, null,
            DBUS_NAME, DBUS_PATH, DBUS_IFACE, null
        );
        this._players = new Map();
        this._proxy = null;
        this._proxySignal = 0;
        this._activeBusName = null;
        this._state = {
            available: false,
            title: 'Not Playing',
            artist: 'Your music',
            playbackStatus: 'Stopped',
            canGoNext: false,
            canGoPrevious: false,
            canPlay: false,
            canPause: false,
            playerName: '',
        };
        this._nameSignal = this._connection.signal_subscribe(
            DBUS_NAME, DBUS_IFACE, 'NameOwnerChanged', DBUS_PATH, null,
            Gio.DBusSignalFlags.NONE,
            (_connection, _sender, _path, _iface, _signal, parameters) => {
                const [name, oldOwner, newOwner] = parameters.deep_unpack();
                if (name.startsWith('org.mpris.MediaPlayer2.'))
                    this._handleName(name, Boolean(newOwner));
            }
        );
        this._discover();
    }

    get state() {
        return {...this._state};
    }

    _emit() {
        this._onStateChanged(this.state);
    }

    _discover() {
        try {
            const result = this._dbus.call_sync(
                'ListNames', null, Gio.DBusCallFlags.NONE, -1, null
            );
            for (const name of result.deep_unpack()[0]) {
                if (name.startsWith('org.mpris.MediaPlayer2.'))
                    this._players.set(name, true);
            }
            this._selectPlayer();
        } catch (error) {
            logError(error, 'Unable to enumerate MPRIS players');
        }
    }

    _handleName(name, hasOwner) {
        if (hasOwner)
            this._players.set(name, true);
        else
            this._players.delete(name);
        this._selectPlayer();
    }

    _selectPlayer() {
        const names = [...this._players.keys()];
        let selected = null;
        let selectedName = null;
        for (const name of names) {
            try {
                const candidate = Gio.DBusProxy.new_sync(
                    this._connection, Gio.DBusProxyFlags.DO_NOT_AUTO_START,
                    null, name, PLAYER_PATH, PLAYER_IFACE, null
                );
                if (unpack(candidate.get_cached_property('PlaybackStatus')) === 'Playing') {
                    selected = candidate;
                    selectedName = name;
                    break;
                }
                if (!selected) {
                    selected = candidate;
                    selectedName = name;
                }
            } catch (error) {
                logError(error, `Unable to connect to MPRIS player ${name}`);
                this._players.delete(name);
            }
        }

        if (selectedName === this._activeBusName)
            return;

        if (this._proxy && this._proxySignal)
            this._proxy.disconnect(this._proxySignal);
        this._proxy = selected;
        this._activeBusName = selectedName;
        this._proxySignal = 0;

        if (selected) {
            this._proxySignal = selected.connect(
                'g-properties-changed', () => this._refresh()
            );
            this._state.playerName = selectedName ?? ''; 
            this._refresh();
        } else {
            this._state = {
                available: false, title: 'Not Playing', artist: 'Your music',
                playbackStatus: 'Stopped', canGoNext: false,
                canGoPrevious: false, canPlay: false, playerName: '',
            };
            this._emit();
        }
    }

    _refresh() {
        if (!this._proxy)
            return;
        const metadata = unpack(this._proxy.get_cached_property('Metadata')) ?? {};
        const title = unpack(metadata['xesam:title']);
        const artists = unpack(metadata['xesam:artist']);
        const identity = unpack(this._proxy.get_cached_property('Identity'));
        this._state = {
            available: true,
            title: typeof title === 'string' && title ? title : 'Unknown track',
            artist: Array.isArray(artists) && artists.length
                ? artists.join(', ') : (typeof artists === 'string' && artists
                    ? artists : (identity || this._activeBusName?.replace('org.mpris.MediaPlayer2.', '') || 'Media player')),
            playbackStatus: unpack(this._proxy.get_cached_property('PlaybackStatus')) || 'Stopped',
            canGoNext: Boolean(unpack(this._proxy.get_cached_property('CanGoNext'))),
            canGoPrevious: Boolean(unpack(this._proxy.get_cached_property('CanGoPrevious'))),
            canPlay: Boolean(unpack(this._proxy.get_cached_property('CanPlay'))),
            canPause: Boolean(unpack(this._proxy.get_cached_property('CanPause'))),
            playerName: identity || '',
        };
        this._emit();
    }

    previous() {
        if (this._state.canGoPrevious)
            callPlayer(this._proxy, 'Previous');
    }

    playPause() {
        if (this._state.canPlay || this._state.canPause)
            callPlayer(this._proxy, 'PlayPause');
    }

    next() {
        if (this._state.canGoNext)
            callPlayer(this._proxy, 'Next');
    }

    destroy() {
        if (this._proxy && this._proxySignal)
            this._proxy.disconnect(this._proxySignal);
        if (this._nameSignal)
            this._connection.signal_unsubscribe(this._nameSignal);
        this._proxy = null;
        this._activeBusName = null;
        this._dbus = null;
        this._connection = null;
        this._players.clear();
    }
}
