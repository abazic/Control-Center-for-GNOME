import Clutter from 'gi://Clutter';
import St from 'gi://St';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

const CIRCLE = 58;
const SPACING = 9;
const GRID_UNIT = (2 * CIRCLE) + SPACING;
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
    const symbol = new St.BoxLayout({style_class: 'cc-symbol-disc', y_align: Clutter.ActorAlign.CENTER});
    symbol.add_child(icon('network-wireless-signal-excellent-symbolic', 21));
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
    button.set_size(CIRCLE, CIRCLE);
    button.set_child(icon(name, 25));
    return button;
}

function makeFocusTile() {
    const tile = makeSurface('cc-focus-tile');
    const symbol = new St.BoxLayout({style_class: 'cc-symbol-disc', y_align: Clutter.ActorAlign.CENTER});
    symbol.add_child(icon('weather-clear-night-symbolic', 20));
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
    tile.set_size(GRID_UNIT, GRID_UNIT);
    tile.y_align = Clutter.ActorAlign.CENTER;

    const artwork = new St.Widget({style_class: 'cc-artwork'});
    artwork.set_size(34, 34);
    artwork.add_child(icon('audio-x-generic-symbolic', 20, 'cc-artwork-icon'));
    const heading = new St.BoxLayout({
        orientation: Clutter.Orientation.VERTICAL,
        style_class: 'cc-media-copy',
    });
    heading.add_child(label('Not Playing', 'cc-media-title'));
    heading.add_child(label('Your music', 'cc-subtitle'));
    const spacer = new St.Widget({y_expand: true});
    const controls = new St.BoxLayout({
        x_expand: true,
        style_class: 'cc-media-controls',
        x_align: Clutter.ActorAlign.CENTER,
    });
    for (const name of ['media-skip-backward-symbolic', 'media-playback-start-symbolic', 'media-skip-forward-symbolic'])
        controls.add_child(icon(name, 16, 'cc-media-control-icon'));
    tile.add_child(artwork);
    tile.add_child(heading);
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
            icon_name: 'view-grid-symbolic',
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
        composition.add_child(makeMediaTile());
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

        item.add_child(content);
        this._indicator.menu.addMenuItem(item);
    }

    disable() {
        this._indicator?.destroy();
        this._indicator = null;
    }
}
