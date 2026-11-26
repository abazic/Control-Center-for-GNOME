import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import {SystemController} from './system.js';
import {MediaController} from './media.js';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

const SMALL = 60;
const SPACING = 10;
const MEDIUM_WIDTH = (2 * SMALL) + SPACING;
const MEDIUM_HEIGHT = SMALL;
const LARGE_WIDTH = (2 * SMALL) + SPACING;
const LARGE_HEIGHT = (2 * SMALL) + SPACING;
const CONTENT_WIDTH = (4 * SMALL) + (3 * SPACING);
const PILL_INSET = 13;
const SYMBOL_SIZE = 33;
const SYMBOL_ICON_SIZE = 17;
const SURFACE = 'cc-surface bms-popup-blur-target';
const MIRROR_UUID = 'mirror@distro.com';
const CAFFEINE_UUID = 'caffeine@patapon.info';
const CAFFEINE_TOGGLE_KEY = 'cli-toggle';

function label(text, styleClass) {
    return new St.Label({text, style_class: styleClass, x_expand: true});
}

function icon(name, size = 22, styleClass = 'cc-icon') {
    return new St.Icon({icon_name: name, icon_size: size, style_class: styleClass});
}

function makeSurface(styleClass, vertical = false) {
    return new St.BoxLayout({
        orientation: vertical ? Clutter.Orientation.VERTICAL : Clutter.Orientation.HORIZONTAL,
        x_expand: false,
        y_expand: false,
        style_class: `${SURFACE} ${styleClass}`,
    });
}

function makeWifiTile(onClick = null) {
    const tile = makeSurface('cc-wifi-tile');
    tile.reactive = Boolean(onClick);
    tile.can_focus = Boolean(onClick);
    if (onClick) {
        tile.connect('button-press-event', () => {
            onClick();
            return Clutter.EVENT_STOP;
        });
    }
    tile.set_size(MEDIUM_WIDTH, MEDIUM_HEIGHT);
    tile.set_style(`width: ${MEDIUM_WIDTH}px; min-width: ${MEDIUM_WIDTH}px; max-width: ${MEDIUM_WIDTH}px; height: ${MEDIUM_HEIGHT}px; min-height: ${MEDIUM_HEIGHT}px; max-height: ${MEDIUM_HEIGHT}px; border-radius: ${MEDIUM_HEIGHT / 2}px; padding: 0 ${PILL_INSET}px;`);
    const symbol = new St.Widget({
        layout_manager: new Clutter.BinLayout(),
        style_class: 'cc-symbol-disc',
    });
    symbol.set_size(SYMBOL_SIZE, SYMBOL_SIZE);
    symbol.set_x_align(Clutter.ActorAlign.CENTER);
    symbol.set_y_align(Clutter.ActorAlign.CENTER);
    symbol.set_style(`width: ${SYMBOL_SIZE}px; min-width: ${SYMBOL_SIZE}px; max-width: ${SYMBOL_SIZE}px; height: ${SYMBOL_SIZE}px; min-height: ${SYMBOL_SIZE}px; max-height: ${SYMBOL_SIZE}px;`);
    const symbolIcon = icon('network-wireless-signal-excellent-symbolic', SYMBOL_ICON_SIZE);
    symbolIcon.set_x_align(Clutter.ActorAlign.CENTER);
    symbolIcon.set_y_align(Clutter.ActorAlign.CENTER);
    symbol.add_child(symbolIcon);
    const copy = new St.BoxLayout({
        orientation: Clutter.Orientation.VERTICAL,
        y_align: Clutter.ActorAlign.CENTER,
        x_expand: true,
        style_class: 'cc-copy',
    });
    const title = label('Wi-Fi', 'cc-title');
    const status = label('Connected', 'cc-subtitle');
    copy.add_child(title);
    copy.add_child(status);
    tile._ccIcon = symbolIcon;
    tile._ccStatusLabel = status;
    tile.add_child(symbol);
    tile.add_child(copy);
    return tile;
}

function makeCircle(name, accessibleName, onClick = null) {
    const button = new St.Button({
        reactive: Boolean(onClick),
        can_focus: Boolean(onClick),
        track_hover: Boolean(onClick),
        style_class: `${SURFACE} cc-round-control`,
        accessible_name: accessibleName,
    });
    button.set_size(SMALL, SMALL);
    button.set_child(icon(name, 25));
    if (onClick)
        button.connect('clicked', onClick);
    return button;
}

function makeFocusTile(onClick = null) {
    const tile = makeSurface('cc-focus-tile');
    tile.reactive = Boolean(onClick);
    tile.can_focus = Boolean(onClick);
    if (onClick) {
        tile.connect('button-press-event', () => {
            onClick();
            return Clutter.EVENT_STOP;
        });
    }
    tile.set_size(MEDIUM_WIDTH, MEDIUM_HEIGHT);
    tile.set_style(`width: ${MEDIUM_WIDTH}px; min-width: ${MEDIUM_WIDTH}px; max-width: ${MEDIUM_WIDTH}px; height: ${MEDIUM_HEIGHT}px; min-height: ${MEDIUM_HEIGHT}px; max-height: ${MEDIUM_HEIGHT}px; border-radius: ${MEDIUM_HEIGHT / 2}px; padding: 0 ${PILL_INSET}px;`);
    const symbol = new St.Widget({
        layout_manager: new Clutter.BinLayout(),
        style_class: 'cc-symbol-disc',
    });
    symbol.set_size(SYMBOL_SIZE, SYMBOL_SIZE);
    symbol.set_x_align(Clutter.ActorAlign.CENTER);
    symbol.set_y_align(Clutter.ActorAlign.CENTER);
    symbol.set_style(`width: ${SYMBOL_SIZE}px; min-width: ${SYMBOL_SIZE}px; max-width: ${SYMBOL_SIZE}px; height: ${SYMBOL_SIZE}px; min-height: ${SYMBOL_SIZE}px; max-height: ${SYMBOL_SIZE}px;`);
    const symbolIcon = icon('weather-clear-night-symbolic', SYMBOL_ICON_SIZE);
    symbolIcon.set_x_align(Clutter.ActorAlign.CENTER);
    symbolIcon.set_y_align(Clutter.ActorAlign.CENTER);
    symbol.add_child(symbolIcon);
    const copy = new St.BoxLayout({
        orientation: Clutter.Orientation.VERTICAL,
        y_align: Clutter.ActorAlign.CENTER,
        x_expand: true,
        style_class: 'cc-copy',
    });
    copy.add_child(label('Focus', 'cc-title'));
    const status = label('Do Not Disturb', 'cc-subtitle');
    copy.add_child(status);
    tile._ccIcon = symbolIcon;
    tile._ccStatusLabel = status;
    tile.add_child(symbol);
    tile.add_child(copy);
    return tile;
}

function makeMediaTile(onPrevious, onPlayPause, onNext) {
    const tile = makeSurface('cc-media-tile', true);
    tile.set_size(LARGE_WIDTH, LARGE_HEIGHT);
    tile.y_align = Clutter.ActorAlign.START;

    const header = new St.BoxLayout({
        orientation: Clutter.Orientation.VERTICAL,
        x_align: Clutter.ActorAlign.START,
        style_class: 'cc-media-header',
    });
    const artwork = new St.Widget({
        layout_manager: new Clutter.BinLayout(),
        style_class: 'cc-artwork',
    });
    artwork.set_size(37, 37);
    const artworkIcon = icon('audio-x-generic-symbolic', 20, 'cc-artwork-icon');
    artworkIcon.set_x_align(Clutter.ActorAlign.CENTER);
    artworkIcon.set_y_align(Clutter.ActorAlign.CENTER);
    artwork.add_child(artworkIcon);
    const heading = new St.BoxLayout({
        orientation: Clutter.Orientation.VERTICAL,
        y_align: Clutter.ActorAlign.CENTER,
        style_class: 'cc-media-copy',
    });
    const titleLabel = label('Not Playing', 'cc-media-title');
    const artistLabel = label('Your music', 'cc-subtitle');
    heading.add_child(titleLabel);
    heading.add_child(artistLabel);
    header.add_child(artwork);
    header.add_child(heading);
    const spacer = new St.Widget({y_expand: true});
    const controls = new St.BoxLayout({
        x_expand: true,
        style_class: 'cc-media-controls',
        x_align: Clutter.ActorAlign.CENTER,
    });
    const makeMediaButton = (name, accessibleName, callback) => {
        const button = new St.Button({
            reactive: true,
            can_focus: true,
            track_hover: true,
            style_class: 'cc-media-control-button',
            accessible_name: accessibleName,
        });
        button.set_child(icon(name, 16, 'cc-media-control-icon'));
        button.connect('clicked', callback);
        return button;
    };
    const previousButton = makeMediaButton(
        'media-skip-backward-symbolic', 'Previous track', onPrevious);
    const playButton = makeMediaButton(
        'media-playback-start-symbolic', 'Play or pause', onPlayPause);
    const nextButton = makeMediaButton(
        'media-skip-forward-symbolic', 'Next track', onNext);
    controls.add_child(previousButton);
    controls.add_child(playButton);
    controls.add_child(nextButton);
    tile._ccTitleLabel = titleLabel;
    tile._ccArtistLabel = artistLabel;
    tile._ccPlayButton = playButton;
    tile._ccPreviousButton = previousButton;
    tile._ccNextButton = nextButton;
    tile.add_child(header);
    tile.add_child(spacer);
    tile.add_child(controls);
    return tile;
}

function makeSliderTile(title, leadingIcon, trailingIcon, fillClass, onValueChanged = null, initialValue = 0.72, trailingAction = null) {
    const tile = new St.BoxLayout({
        orientation: Clutter.Orientation.VERTICAL,
        x_expand: true,
        style_class: `${SURFACE} cc-slider-tile`,
    });
    tile.set_size(CONTENT_WIDTH, SMALL);
    const heading = new St.BoxLayout({x_expand: true, style_class: 'cc-slider-heading'});
    heading.add_child(label(title, 'cc-slider-title'));
    tile.add_child(heading);
    const controls = new St.BoxLayout({
        x_expand: true,
        y_align: Clutter.ActorAlign.CENTER,
        style_class: 'cc-slider-controls',
    });
    controls.add_child(icon(leadingIcon, 15, 'cc-slider-icon'));
    const track = new St.Widget({x_expand: true, style_class: 'cc-slider-track'});
    const fill = new St.Widget({style_class: `cc-slider-fill ${fillClass}`});
    track.add_child(fill);
    const setValue = value => {
        const normalized = Math.max(0, Math.min(1, value));
        fill.set_style(`width: ${normalized * 100}%;`);
        if (onValueChanged)
            onValueChanged(normalized);
    };
    if (onValueChanged) {
        track.reactive = true;
        track.can_focus = true;
        const updateFromEvent = event => {
            const [stageX] = event.get_coords();
            const [trackX] = track.get_transformed_position();
            const width = track.get_width();
            if (width > 0)
                setValue((stageX - trackX) / width);
        };
        track.connect('button-press-event', (actor, event) => {
            updateFromEvent(event);
            return Clutter.EVENT_STOP;
        });
        track.connect('motion-event', (actor, event) => {
            if ((event.get_state() & Clutter.ModifierType.BUTTON1_MASK) === 0)
                return Clutter.EVENT_PROPAGATE;
            updateFromEvent(event);
            return Clutter.EVENT_STOP;
        });
    }
    fill.set_style(`width: ${initialValue * 100}%;`);
    tile._ccSetValue = value => fill.set_style(`width: ${Math.max(0, Math.min(1, value)) * 100}%;`);
    controls.add_child(track);
    if (trailingAction) {
        const trailingButton = new St.Button({
            reactive: true,
            can_focus: true,
            style_class: 'cc-slider-icon-button',
            accessible_name: 'Toggle mute',
        });
        trailingButton.set_child(icon(trailingIcon, 15, 'cc-slider-icon'));
        trailingButton.connect('clicked', trailingAction);
        tile._ccTrailingButton = trailingButton;
        controls.add_child(trailingButton);
    } else {
        controls.add_child(icon(trailingIcon, 15, 'cc-slider-icon'));
    }
    tile.add_child(controls);
    return tile;
}

export default class ControlCenterExtension extends Extension {
    enable() {
        this._initCaffeineIntegration();
        this._mediaController = new MediaController(state => {
            this._mediaState = state;
            this._syncMediaState();
        });
        this._controller = new SystemController(state => {
            this._systemState = state;
            this._syncSystemState();
        });
        this._indicator = new PanelMenu.Button(0.0, this.metadata.name, false);
        this._indicator.add_child(new St.Icon({
            gicon: new Gio.FileIcon({file: this.dir.get_child('control-center-symbolic.svg')}),
            icon_size: 22,
            style_class: 'system-status-icon',
        }));
        this._indicator.menu.actor.add_style_class_name('cc-control-center-menu');
        this._buildMenu();
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    _buildMenu() {
        const item = new PopupMenu.PopupBaseMenuItem({
            reactive: false,
            can_focus: false,
            style_class: 'cc-menu-item',
        });
        const content = new St.BoxLayout({
            orientation: Clutter.Orientation.VERTICAL,
            style_class: 'cc-content',
        });

        const composition = new St.BoxLayout({
            style_class: 'cc-main-grid',
            x_expand: true,
        });
        const left = new St.BoxLayout({
            orientation: Clutter.Orientation.VERTICAL,
            style_class: 'cc-left-column',
            x_expand: false,
        });
        this._wifiTile = makeWifiTile(() => this._controller.toggleWifi());
        left.add_child(this._wifiTile);

        const connectivity = new St.BoxLayout({style_class: 'cc-circle-row'});
        this._bluetoothButton = makeCircle(
            'bluetooth-active-symbolic', 'Bluetooth', () => this._controller.toggleBluetooth());
        connectivity.add_child(this._bluetoothButton);
        this._airplaneButton = makeCircle(
            'airplane-mode-symbolic', 'Airplane Mode', () => this._controller.toggleAirplaneMode());
        connectivity.add_child(this._airplaneButton);
        left.add_child(connectivity);
        this._focusTile = makeFocusTile(() => this._controller.toggleFocus());
        left.add_child(this._focusTile);

        composition.add_child(left);

        const mediaColumn = new St.BoxLayout({
            orientation: Clutter.Orientation.VERTICAL,
            style_class: 'cc-media-column',
        });
        this._mediaTile = makeMediaTile(
            () => this._mediaController.previous(),
            () => this._mediaController.playPause(),
            () => this._mediaController.next()
        );
        mediaColumn.add_child(this._mediaTile);

        const mediaActions = new St.BoxLayout({
            style_class: 'cc-media-actions',
        });
        this._mirrorButton = makeCircle(
            'phone-symbolic', 'Mirror Android device', () => this._openMirrorMenu());
        mediaActions.add_child(this._mirrorButton);
        this._caffeineButton = makeCircle(
            'alarm-clock-symbolic', 'Caffeine Timer', () => this._openCaffeineMenu());
        mediaActions.add_child(this._caffeineButton);
        this._syncCaffeineState();
        mediaColumn.add_child(mediaActions);

        composition.add_child(mediaColumn);
        content.add_child(composition);

        this._brightnessTile = makeSliderTile(
            'Display', 'display-brightness-symbolic', 'weather-clear-symbolic', 'cc-brightness-fill',
            value => this._controller.setBrightness(value), 0.65);
        content.add_child(this._brightnessTile);
        this._volumeTile = makeSliderTile(
            'Sound', 'audio-volume-low-symbolic', 'audio-volume-high-symbolic', 'cc-volume-fill',
            value => this._controller.setVolume(value), 0.72,
            () => this._controller.toggleMute());
        content.add_child(this._volumeTile);

        const shortcuts = new St.BoxLayout({
            style_class: 'cc-shortcuts',
            x_expand: true,
        });
        for (const [name, accessibleName] of [
            ['contrast-symbolic', 'Appearance'],
            ['accessories-calculator-symbolic', 'Calculator'],
            ['preferences-system-time-symbolic', 'Timer'],
            ['camera-photo-symbolic', 'Screenshot'],
        ])
            shortcuts.add_child(makeCircle(name, accessibleName));
        content.add_child(shortcuts);

        const editControlRow = new St.BoxLayout({
            x_expand: true,
            style_class: 'cc-edit-control-row',
        });
        const editControlLeftSpacer = new St.Widget({x_expand: true});
        const editControlRightSpacer = new St.Widget({x_expand: true});
        const editControlButton = new St.Button({
            reactive: false,
            can_focus: false,
            track_hover: false,
            style_class: `${SURFACE} cc-edit-control-button`,
            accessible_name: 'Edit Control',
        });
        editControlButton.set_size(86, 21);
        editControlButton.set_child(new St.Label({
            text: 'Edit Control',
            style_class: 'cc-edit-control-label',
        }));
        editControlRow.add_child(editControlLeftSpacer);
        editControlRow.add_child(editControlButton);
        editControlRow.add_child(editControlRightSpacer);
        content.add_child(editControlRow);

        item.add_child(content);
        this._indicator.menu.addMenuItem(item);
        this._syncSystemState();
    }

    _syncSystemState() {
        const state = this._systemState;
        if (!state)
            return;

        if (this._wifiTile) {
            this._wifiTile._ccStatusLabel.text = state.wifiAvailable
                ? (state.wifiEnabled ? 'On' : 'Off') : 'Unavailable';
            this._wifiTile._ccIcon.icon_name = state.wifiEnabled
                ? 'network-wireless-signal-excellent-symbolic'
                : 'network-wireless-offline-symbolic';
        }

        if (this._bluetoothButton) {
            const glyph = this._bluetoothButton.get_child();
            glyph.icon_name = state.bluetoothEnabled
                ? 'bluetooth-active-symbolic' : 'bluetooth-disabled-symbolic';
            this._bluetoothButton.accessible_name = state.bluetoothAvailable
                ? (state.bluetoothEnabled ? 'Bluetooth On' : 'Bluetooth Off')
                : 'Bluetooth unavailable';
        }

        if (this._airplaneButton) {
            const glyph = this._airplaneButton.get_child();
            glyph.icon_name = state.airplaneEnabled
                ? 'airplane-mode-symbolic' : 'network-wireless-signal-excellent-symbolic';
            this._airplaneButton.accessible_name = state.airplaneEnabled
                ? 'Airplane Mode On' : 'Airplane Mode Off';
            this._airplaneButton.reactive = state.airplaneAvailable;
        }

        if (this._focusTile) {
            this._focusTile._ccStatusLabel.text = state.focusEnabled
                ? 'On' : 'Do Not Disturb';
            this._focusTile._ccIcon.icon_name = state.focusEnabled
                ? 'weather-clear-night-symbolic' : 'notifications-symbolic';
        }

        if (this._brightnessTile && state.brightnessAvailable)
            this._brightnessTile._ccSetValue(state.brightness);

        if (this._volumeTile) {
            this._volumeTile._ccTrailingButton.reactive = state.audioAvailable;
            if (state.audioAvailable)
                this._volumeTile._ccSetValue(state.volume);
            const muteIcon = this._volumeTile._ccTrailingButton?.get_child();
            if (muteIcon)
                muteIcon.icon_name = state.muted
                    ? 'audio-volume-muted-symbolic' : 'audio-volume-high-symbolic';
        }
    }

    _initCaffeineIntegration() {
        if (this._caffeineSettings)
            return;
        try {
            const extension = Main.extensionManager.lookup(CAFFEINE_UUID);
            if (!extension?.stateObj)
                return;

            this._caffeineSettings = extension.stateObj.getSettings();
            this._caffeineSignal = this._caffeineSettings.connect(
                `changed::${CAFFEINE_TOGGLE_KEY}`,
                () => this._syncCaffeineState()
            );
        } catch (error) {
            logError(error, 'Unable to connect to Caffeine settings');
        }
    }

    _syncCaffeineState() {
        if (!this._caffeineButton || !this._caffeineSettings)
            return;

        const active = this._caffeineSettings.get_boolean(CAFFEINE_TOGGLE_KEY);
        const glyph = this._caffeineButton.get_child();
        glyph.icon_name = active ? 'alarm-clock-symbolic' : 'timer-symbolic';
        this._caffeineButton.opacity = active ? 255 : 190;
        this._caffeineButton.accessible_name = active
            ? 'Caffeine enabled. Click to disable'
            : 'Caffeine disabled. Click to enable';
    }

    _openCaffeineMenu() {
        this._initCaffeineIntegration();
        this._syncCaffeineState();
        const extension = Main.extensionManager.lookup(CAFFEINE_UUID);
        const caffeineToggle = extension?.stateObj?._caffeineIndicator
            ?.quickSettingsItems?.[0];

        if (!caffeineToggle?.menu) {
            Main.notifyError(
                'Caffeine extension unavailable',
                'Install and enable Caffeine (caffeine@patapon.info) to use its timer.'
            );
            return;
        }

        this._indicator.menu.close();
        GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
            if (caffeineToggle.menu)
                caffeineToggle.menu.open();
            return GLib.SOURCE_REMOVE;
        });
    }

    _openMirrorMenu() {
        const extension = Main.extensionManager.lookup(MIRROR_UUID);
        const mirrorToggle = extension?.stateObj?._indicator
            ?.quickSettingsItems?.[0];

        if (!mirrorToggle?.menu) {
            Main.notifyError(
                'Mirror extension unavailable',
                'Install and enable Mirror (mirror@distro.com) to browse Android devices.'
            );
            return;
        }

        this._indicator.menu.close();
        GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
            if (mirrorToggle.menu)
                mirrorToggle.menu.open();
            return GLib.SOURCE_REMOVE;
        });
    }

    _syncMediaState() {
        const state = this._mediaState;
        if (!state || !this._mediaTile)
            return;
        this._mediaTile._ccTitleLabel.text = state.title;
        this._mediaTile._ccArtistLabel.text = state.artist;
        const playIcon = this._mediaTile._ccPlayButton.get_child();
        const playing = state.playbackStatus === 'Playing';
        playIcon.icon_name = playing
            ? 'media-playback-pause-symbolic' : 'media-playback-start-symbolic';
        this._mediaTile._ccPlayButton.accessible_name = playing ? 'Pause' : 'Play';
        const canTogglePlayback = state.canPlay || state.canPause;
        this._mediaTile._ccPlayButton.reactive = canTogglePlayback;
        this._mediaTile._ccPlayButton.opacity = canTogglePlayback ? 255 : 110;
        this._mediaTile._ccPreviousButton.reactive = state.canGoPrevious;
        this._mediaTile._ccPreviousButton.opacity = state.canGoPrevious ? 255 : 110;
        this._mediaTile._ccNextButton.reactive = state.canGoNext;
        this._mediaTile._ccNextButton.opacity = state.canGoNext ? 255 : 110;
    }

    disable() {
        if (this._caffeineSettings && this._caffeineSignal)
            this._caffeineSettings.disconnect(this._caffeineSignal);
        this._caffeineSignal = 0;
        this._caffeineSettings = null;
        this._mediaController?.destroy();
        this._mediaController = null;
        this._controller?.destroy();
        this._controller = null;
        this._indicator?.destroy();
        this._indicator = null;
    }
}
