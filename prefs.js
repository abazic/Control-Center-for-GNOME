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

        const settings = this.getSettings();
        const sizeValues = ['small', 'medium', 'large'];
        const sizeModel = Gtk.StringList.new(['Small', 'Medium', 'Large']);
        const appearanceGroup = new Adw.PreferencesGroup({
            title: 'Tile sizes',
            description: 'Set the size of each Control Center tile independently. Small: 60 × 60 px; Medium: 130 × 60 px; Large: 130 × 130 px.',
        });

        for (const [key, title] of [
            ['wifi-tile-size', 'Wi-Fi'],
            ['bluetooth-tile-size', 'Bluetooth'],
            ['airplane-tile-size', 'Airplane Mode'],
            ['focus-tile-size', 'Focus / Do Not Disturb'],
            ['media-tile-size', 'Media Player'],
            ['mirror-tile-size', 'Mirror'],
            ['caffeine-tile-size', 'Caffeine'],
        ]) {
            const row = new Adw.ComboRow({title, model: sizeModel});
            const current = settings.get_string(key);
            row.selected = Math.max(0, sizeValues.indexOf(current));
            row.connect('notify::selected', () => {
                settings.set_string(key, sizeValues[row.selected] ?? 'small');
            });
            appearanceGroup.add(row);
        }
        page.add(appearanceGroup);

        const integrationGroup = new Adw.PreferencesGroup({
            title: 'System integration',
            description: 'Control Center uses its own macOS-inspired interface and controls the same GNOME system services as native Quick Settings.',
        });
        const hideQuickSettingsRow = new Adw.SwitchRow({
            title: 'Kunci Quick Settings bawaan',
            subtitle: 'Ikon tetap tampil di panel atas, tetapi menunya tidak bisa dibuka.',
        });
        hideQuickSettingsRow.active = settings.get_boolean('hide-native-quick-settings');
        hideQuickSettingsRow.connect('notify::active', () => {
            settings.set_boolean('hide-native-quick-settings', hideQuickSettingsRow.active);
        });
        integrationGroup.add(hideQuickSettingsRow);
        page.add(integrationGroup);

        window.add(page);
    }
}
