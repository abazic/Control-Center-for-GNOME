import Clutter from 'gi://Clutter';
import St from 'gi://St';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

const PILL_CLASS = 'cc-pill bms-popup-blur-target';

function makeIcon(iconName, size = 20) {
    return new St.Icon({
        icon_name: iconName,
        icon_size: size,
        style_class: 'cc-pill-icon',
    });
}

function makeLabel(text, styleClass) {
    return new St.Label({
        text,
        x_expand: true,
        style_class: styleClass,
    });
}

/* Every pill is an independent Blur my Shell surface. */
function makePill({icon, title, subtitle, extraClass = ''}) {
    const pill = new St.BoxLayout({
        orientation: Clutter.Orientation.VERTICAL,
        x_expand: true,
        style_class: `${PILL_CLASS} ${extraClass}`.trim(),
    });

    const row = new St.BoxLayout({
        orientation: Clutter.Orientation.HORIZONTAL,
        x_expand: true,
        y_align: Clutter.ActorAlign.CENTER,
        style_class: 'cc-pill-header',
    });
    row.add_child(makeIcon(icon));

    const labels = new St.BoxLayout({
        orientation: Clutter.Orientation.VERTICAL,
        x_expand: true,
        y_align: Clutter.ActorAlign.CENTER,
        style_class: 'cc-pill-labels',
    });
    labels.add_child(makeLabel(title, 'cc-pill-title'));
    if (subtitle)
        labels.add_child(makeLabel(subtitle, 'cc-pill-subtitle'));

    row.add_child(labels);
    pill.add_child(row);
    return pill;
}

function makeMediaPill() {
    const pill = new St.BoxLayout({
        orientation: Clutter.Orientation.VERTICAL,
        x_expand: true,
        style_class: `${PILL_CLASS} cc-media-pill`,
    });

    const header = new St.BoxLayout({
        orientation: Clutter.Orientation.HORIZONTAL,
        x_expand: true,
        y_align: Clutter.ActorAlign.CENTER,
        style_class: 'cc-pill-header',
    });
    header.add_child(makeIcon('audio-x-generic-symbolic', 22));

    const labels = new St.BoxLayout({
        orientation: Clutter.Orientation.VERTICAL,
        x_expand: true,
        style_class: 'cc-pill-labels',
    });
    labels.add_child(makeLabel('Not Playing', 'cc-pill-title'));
    labels.add_child(makeLabel('Media controls preview', 'cc-pill-subtitle'));
    header.add_child(labels);
    pill.add_child(header);

    const controls = new St.BoxLayout({
        orientation: Clutter.Orientation.HORIZONTAL,
        x_align: Clutter.ActorAlign.CENTER,
        style_class: 'cc-media-controls',
    });
    for (const iconName of [
        'media-skip-backward-symbolic',
        'media-playback-start-symbolic',
        'media-skip-forward-symbolic',
    ]) {
        controls.add_child(new St.Icon({
            icon_name: iconName,
            icon_size: 18,
            style_class: 'cc-media-control-icon',
        }));
    }
    pill.add_child(controls);
    return pill;
}

export default class ControlCenterExtension extends Extension {
    enable() {
        console.debug(`${this.metadata.name}: enabling`);

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

        const connectivity = new St.BoxLayout({
            orientation: Clutter.Orientation.HORIZONTAL,
            style_class: 'cc-pill-row',
        });
        connectivity.add_child(makePill({
            icon: 'network-wireless-signal-excellent-symbolic',
            title: 'Wi-Fi',
            subtitle: 'Coming soon',
        }));
        connectivity.add_child(makePill({
            icon: 'bluetooth-active-symbolic',
            title: 'Bluetooth',
            subtitle: 'Coming soon',
        }));
        content.add_child(connectivity);

        content.add_child(makeMediaPill());

        const modes = new St.BoxLayout({
            orientation: Clutter.Orientation.HORIZONTAL,
            style_class: 'cc-pill-row',
        });
        modes.add_child(makePill({
            icon: 'airplane-mode-symbolic',
            title: 'Airplane Mode',
            subtitle: 'Coming soon',
        }));
        modes.add_child(makePill({
            icon: 'weather-clear-night-symbolic',
            title: 'Focus',
            subtitle: 'Do Not Disturb',
        }));
        content.add_child(modes);

        content.add_child(makePill({
            icon: 'display-brightness-symbolic',
            title: 'Display',
            subtitle: 'Brightness control coming soon',
            extraClass: 'cc-wide-pill',
        }));
        content.add_child(makePill({
            icon: 'audio-volume-high-symbolic',
            title: 'Sound',
            subtitle: 'Volume control coming soon',
            extraClass: 'cc-wide-pill',
        }));

        const footer = new St.BoxLayout({
            x_align: Clutter.ActorAlign.CENTER,
            style_class: 'cc-footer',
        });
        footer.add_child(makeLabel('CONTROL CENTER  ·  PREVIEW', 'cc-footer-label'));
        content.add_child(footer);

        item.add_child(content);
        this._indicator.menu.addMenuItem(item);
    }

    disable() {
        console.debug(`${this.metadata.name}: disabling`);
        this._indicator?.destroy();
        this._indicator = null;
    }
}
