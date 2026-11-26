import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import St from 'gi://St';

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

function makeWifiTile() {
    const tile = makeSurface('cc-wifi-tile');
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
    copy.add_child(label('Wi-Fi', 'cc-title'));
    copy.add_child(label('Connected', 'cc-subtitle'));
    tile.add_child(symbol);
    tile.add_child(copy);
    return tile;
}

function makeCircle(name, accessibleName) {
    const button = new St.Button({
        reactive: false,
        can_focus: false,
        track_hover: false,
        style_class: `${SURFACE} cc-round-control`,
        accessible_name: accessibleName,
    });
    button.set_size(SMALL, SMALL);
    button.set_child(icon(name, 25));
    return button;
}

function makeFocusTile() {
    const tile = makeSurface('cc-focus-tile');
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
    copy.add_child(label('Do Not Disturb', 'cc-subtitle'));
    tile.add_child(symbol);
    tile.add_child(copy);
    return tile;
}

function makeMediaTile() {
    const tile = makeSurface('cc-media-tile', true);
    tile.set_size(LARGE_WIDTH, LARGE_HEIGHT);
    tile.y_align = Clutter.ActorAlign.START;

    const header = new St.BoxLayout({
        style_class: 'cc-media-header',
    });
    const artwork = new St.Widget({style_class: 'cc-artwork'});
    artwork.set_size(37, 37);
    artwork.add_child(icon('audio-x-generic-symbolic', 20, 'cc-artwork-icon'));
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

function makeSliderTile(title, leadingIcon, trailingIcon, fillClass) {
    const tile = new St.BoxLayout({
        orientation: Clutter.Orientation.VERTICAL,
        x_expand: true,
        style_class: `${SURFACE} cc-slider-tile`,
    });
    const heading = new St.BoxLayout({x_expand: true, style_class: 'cc-slider-heading'});
    heading.add_child(label(title, 'cc-slider-title'));
    tile.add_child(heading);
    const controls = new St.BoxLayout({
        x_expand: true,
        y_align: Clutter.ActorAlign.CENTER,
        style_class: 'cc-slider-controls',
    });
    controls.add_child(icon(leadingIcon, 17));
    const track = new St.Widget({x_expand: true, style_class: 'cc-slider-track'});
    track.add_child(new St.Widget({style_class: `cc-slider-fill ${fillClass}`}));
    controls.add_child(track);
    controls.add_child(icon(trailingIcon, 17));
    tile.add_child(controls);
    return tile;
}

export default class ControlCenterExtension extends Extension {
    enable() {
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
        left.add_child(makeWifiTile());

        const connectivity = new St.BoxLayout({style_class: 'cc-circle-row'});
        connectivity.add_child(makeCircle('bluetooth-active-symbolic', 'Bluetooth'));
        connectivity.add_child(makeCircle('radio-symbolic', 'Nearby devices'));
        left.add_child(connectivity);
        left.add_child(makeFocusTile());

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
        content.add_child(makeSliderTile(
            'Sound', 'audio-volume-low-symbolic', 'audio-volume-high-symbolic', 'cc-volume-fill'));

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
    }

    disable() {
        this._indicator?.destroy();
        this._indicator = null;
    }
}
