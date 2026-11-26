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
            description: 'Choose the default tile size used by the Control Center layout.',
        });

        const sizeModel = Gtk.StringList.new(['Small', 'Medium', 'Large']);
        const sizeRow = new Adw.ComboRow({
            title: 'Button size',
            subtitle: 'Small is the default size (60 × 60 px). Medium uses 130 × 60 px pills; Large uses 130 × 130 px squares.',
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
            title: 'System integration',
            description: 'Control Center uses its own macOS-inspired interface and controls the same GNOME system services as native Quick Settings.',
        });
        const hideQuickSettingsRow = new Adw.SwitchRow({
            title: 'Hide Quick Settings bawaan',
            subtitle: 'Sembunyikan indikator Quick Settings GNOME dari panel atas saat Control Center aktif.',
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
