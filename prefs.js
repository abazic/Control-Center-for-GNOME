import Adw from 'gi://Adw';
import GLib from 'gi://GLib';
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
            ['power-mode-tile-size', 'Power Mode'],
        ]) {
            const row = new Adw.ComboRow({title, model: sizeModel});
            const current = settings.get_string(key);
            row.selected = Math.max(0, sizeValues.indexOf(current));
            row.connect('notify::selected', () => {
                settings.set_string(key, sizeValues[row.selected] ?? 'small');
            });
            if (key === 'media-tile-size') {
                row.selected = 2;
                row.sensitive = false;
                row.subtitle = 'Hanya tersedia dalam ukuran Large';
            }
            appearanceGroup.add(row);
        }
        page.add(appearanceGroup);

        const extraGroup = new Adw.PreferencesGroup({
            title: 'Toggle lainnya',
            description: 'Toggle dari Quick Settings. Buka Control Center sekali, lalu buka ulang jendela ini bila daftarnya belum lengkap.',
        });
        const known = settings.get_value('known-toggles').deepUnpack();
        for (const [id, title] of Object.entries(known)) {
            const row = new Adw.ComboRow({
                title,
                use_markup: false,
                model: Gtk.StringList.new(['Small', 'Medium', 'Large']),
            });
            const sizes = settings.get_value('extra-tile-sizes').deepUnpack();
            row.selected = Math.max(0, sizeValues.indexOf(sizes[id]));
            row.connect('notify::selected', () => {
                const next = settings.get_value('extra-tile-sizes').deepUnpack();
                next[id] = sizeValues[row.selected] ?? 'small';
                settings.set_value('extra-tile-sizes', new GLib.Variant('a{ss}', next));
            });
            extraGroup.add(row);
        }
        page.add(extraGroup);

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
