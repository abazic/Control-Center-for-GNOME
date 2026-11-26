import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class ControlCenterPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window.search_enabled = false;
        window.set_default_size(520, 360);

        const page = new Adw.PreferencesPage({
            title: 'General',
            icon_name: 'preferences-system-symbolic',
        });

        const appearanceGroup = new Adw.PreferencesGroup({
            title: 'Control size',
            description: 'Choose the default size for tiles in the integrated Quick Settings area.',
        });

        const sizeModel = Gtk.StringList.new(['Small', 'Medium', 'Large']);
        const sizeRow = new Adw.ComboRow({
            title: 'Button size',
            subtitle: 'Small is the default and most compact layout.',
            model: sizeModel,
        });

        const settings = this.getSettings();
        const sizeValues = ['small', 'medium', 'large'];
        const currentSize = settings.get_string('quick-settings-size');
        sizeRow.selected = Math.max(0, sizeValues.indexOf(currentSize));
        sizeRow.connect('notify::selected', () => {
            const selected = sizeValues[sizeRow.selected] ?? 'small';
            settings.set_string('quick-settings-size', selected);
        });

        appearanceGroup.add(sizeRow);
        page.add(appearanceGroup);

        const integrationGroup = new Adw.PreferencesGroup({
            title: 'Quick Settings integration',
            description: 'Control Center hosts the live GNOME Quick Settings grid, including compatible extension items.',
        });
        const compatibilityRow = new Adw.ActionRow({
            title: 'Native Quick Settings replacement',
            subtitle: 'The original panel entry is hidden while Control Center is enabled and restored when it is disabled.',
        });
        compatibilityRow.add_prefix(new Gtk.Image({
            icon_name: 'view-grid-symbolic',
            pixel_size: 24,
        }));
        integrationGroup.add(compatibilityRow);
        page.add(integrationGroup);

        window.add(page);
    }
}
