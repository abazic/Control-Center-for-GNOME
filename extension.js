import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import St from 'gi://St';
import {SystemController} from './system.js';

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

function makeMediaTile() {
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
    heading.add_child(label('Not Playing', 'cc-media-title'));
    heading.add_child(label('Your music', 'cc-subtitle'));
    header.add_child(artwork);
    header.add_child(heading);
    const spacer = new St.Widget({y_expand: true});
    const controls = new St.BoxLayout({
        x_expand: true,
        style_class: 'cc-media-controls',
        x_align: Clutter.ActorAlign.CENTER,
    });
    for (const name of ['media-skip-backward-symbolic', 'media-playback-start-symbolic', 'media-skip-forward-symbolic'])
        controls.add_child(icon(name, 16, 'cc-media-control-icon'));
    tile.add_child(header);
    tile.add_child(spacer);
    tile.add_child(controls);
    return tile;
}

function makeSliderTile(title, leadingIcon, trailingIcon, fillClass, onValueChanged = null, initialValue = 0.72) {
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
        track.connect('button-press-event', (actor, event) => {
            const [stageX] = event.get_coords();
            const [trackX] = track.get_transformed_position();
            const width = track.get_width();
            if (width > 0)
                setValue((stageX - trackX) / width);
            return Clutter.EVENT_STOP;
        });
    }
    fill.set_style(`width: ${initialValue * 100}%;`);
    tile._ccSetValue = value => fill.set_style(`width: ${Math.max(0, Math.min(1, value)) * 100}%;`);
    controls.add_child(track);
    controls.add_child(icon(trailingIcon, 15, 'cc-slider-icon'));
    tile.add_child(controls);
    return tile;
}

export default class ControlCenterExtension extends Extension {
    enable() {
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
        connectivity.add_child(makeCircle('radio-symbolic', 'Nearby devices'));
        left.add_child(connectivity);
        this._focusTile = makeFocusTile(() => this._controller.toggleFocus());
        left.add_child(this._focusTile);

        composition.add_child(left);

        const mediaColumn = new St.BoxLayout({
            orientation: Clutter.Orientation.VERTICAL,
            style_class: 'cc-media-column',
        });
        mediaColumn.add_child(makeMediaTile());

        const mediaActions = new St.BoxLayout({
            style_class: 'cc-media-actions',
        });
        mediaActions.add_child(makeCircle('video-display-symbolic', 'Mirror'));
        mediaActions.add_child(makeCircle('power-profile-performance-symbolic', 'Power Mode'));
        mediaColumn.add_child(mediaActions);

        composition.add_child(mediaColumn);
        content.add_child(composition);

        content.add_child(makeSliderTile(
            'Display', 'display-brightness-symbolic', 'weather-clear-symbolic', 'cc-brightness-fill'));
        this._volumeTile = makeSliderTile(
            'Sound', 'audio-volume-low-symbolic', 'audio-volume-high-symbolic', 'cc-volume-fill',
            value => this._controller.setVolume(value), 0.72);
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

        if (this._focusTile) {
            this._focusTile._ccStatusLabel.text = state.focusEnabled
                ? 'On' : 'Do Not Disturb';
            this._focusTile._ccIcon.icon_name = state.focusEnabled
                ? 'weather-clear-night-symbolic' : 'notifications-symbolic';
        }

        if (this._volumeTile && state.audioAvailable)
            this._volumeTile._ccSetValue(state.volume);
    }

    disable() {
        this._controller?.destroy();
        this._controller = null;
        this._indicator?.destroy();
        this._indicator = null;
    }
}
