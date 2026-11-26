import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class ControlCenterPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window.search_enabled = false;

        const page = new Adw.PreferencesPage({
            title: 'General',
            icon_name: 'preferences-system-symbolic',
        });

        const group = new Adw.PreferencesGroup({
            title: 'Control Center',
            description: 'Extension preferences',
        });

        const placeholder = new Adw.ActionRow({
            title: 'Settings are coming soon',
            subtitle: 'This page is ready for the options that will be added next.',
        });
        placeholder.add_prefix(new Gtk.Image({
            icon_name: 'preferences-other-symbolic',
            pixel_size: 24,
        }));
        group.add(placeholder);
        page.add(group);
        window.add(page);
    }
}
