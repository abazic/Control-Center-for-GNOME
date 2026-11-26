import Clutter from 'gi://Clutter';
import St from 'gi://St';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

const PILL_CLASS = 'cc-pill bms-popup-blur-target';

function createIcon(iconName, size = 20) {
    return new St.Icon({
        icon_name: iconName,
        icon_size: size,
        style_class: 'cc-pill-icon',
    });
}

function createPill({icon, title, subtitle, styleClass = ''}) {
    const pill = new St.BoxLayout({
        vertical: true,
        x_expand: true,
        style_class: `${PILL_CLASS} ${styleClass}`.trim(),
    });

    const header = new St.BoxLayout({
        vertical: false,
        x_expand: true,
        y_align: Clutter.ActorAlign.CENTER,
        style_class: 'cc-pill-header',
    });
    header.add_child(createIcon(icon));

    const labels = new St.BoxLayout({
        vertical: true,
        x_expand: true,
        y_align: Clutter.ActorAlign.CENTER,
        style_class: 'cc-pill-labels',
    });
    labels.add_child(new St.Label({
        text: title,
        style_class: 'cc-pill-title',
        x_expand: true,
    }));

    if (subtitle) {
        labels.add_child(new St.Label({
            text: subtitle,
            style_class: 'cc-pill-subtitle',
            x_expand: true,
        }));
    }

    header.add_child(labels);
    pill.add_child(header);
    return pill;
}

function createMediaPill() {
    const pill = new St.BoxLayout({
        vertical: true,
        x_expand: true,
        style_class: `${PILL_CLASS} cc-media-pill`,
    });

    const top = new St.BoxLayout({
        vertical: false,
        x_expand: true,
        y_align: Clutter.ActorAlign.CENTER,
    });
    top.add_child(createIcon('audio-x-generic-symbolic', 22));

    const labels = new St.BoxLayout({
        vertical: true,
        x_expand: true,
        style_class: 'cc-pill-labels',
    });
    labels.add_child(new St.Label({
        text: 'Not Playing',
        style_class: 'cc-pill-title',
    }));
    labels.add_child(new St.Label({
        text: 'Media controls will appear here',
        style_class: 'cc-pill-subtitle',
    }));
    top.add_child(labels);
    pill.add_child(top);

    const controls = new St.BoxLayout({
        vertical: false,
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
        const section = new PopupMenu.PopupMenuSection();
        this._indicator.menu.addMenuItem(section);

        const menuItem = new PopupMenu.PopupBaseMenuItem({
            reactive: false,
            can_focus: false,
            style_class: 'cc-menu-item',
        });

        const content = new St.BoxLayout({
            vertical: true,
            style_class: 'cc-content',
        });

        const connectivityRow = new St.BoxLayout({
            vertical: false,
            style_class: 'cc-pill-row',
        });
        connectivityRow.add_child(createPill({
            icon: 'network-wireless-signal-excellent-symbolic',
            title: 'Wi-Fi',
            subtitle: 'System integration pending',
        }));
        connectivityRow.add_child(createPill({
            icon: 'bluetooth-active-symbolic',
            title: 'Bluetooth',
            subtitle: 'System integration pending',
        }));
        content.add_child(connectivityRow);

        content.add_child(createMediaPill());

        const modesRow = new St.BoxLayout({
            vertical: false,
            style_class: 'cc-pill-row',
        });
        modesRow.add_child(createPill({
            icon: 'airplane-mode-symbolic',
            title: 'Airplane Mode',
            subtitle: 'System integration pending',
        }));
        modesRow.add_child(createPill({
            icon: 'moon-symbolic',
            title: 'Focus',
            subtitle: 'Do Not Disturb',
        }));
        content.add_child(modesRow);

        content.add_child(createPill({
            icon: 'display-brightness-symbolic',
            title: 'Display',
            subtitle: 'Brightness control — coming next',
            styleClass: 'cc-wide-pill',
        }));

        content.add_child(createPill({
            icon: 'audio-volume-high-symbolic',
            title: 'Sound',
            subtitle: 'Volume control — coming next',
            styleClass: 'cc-wide-pill',
        }));

        const footer = new St.BoxLayout({
            vertical: false,
            x_align: Clutter.ActorAlign.CENTER,
            style_class: 'cc-footer',
        });
        footer.add_child(new St.Label({
            text: 'Control Center · Preview',
            style_class: 'cc-footer-label',
        }));
        content.add_child(footer);

        menuItem.add_child(content);
        section.addMenuItem(menuItem);
    }

    disable() {
        this._indicator?.destroy();
        this._indicator = null;
    }
}
