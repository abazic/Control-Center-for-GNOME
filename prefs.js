import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import GObject from 'gi://GObject';
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
        const tilesGroup = new Adw.PreferencesGroup({
            title: 'Tiles',
            description: 'Seret pegangan di kiri untuk mengubah urutan. Small: 60 × 60 px; Medium: 130 × 60 px; Large: 130 × 130 px.',
        });

        // Urutan di sini adalah urutan default.
        const fixedTiles = [
            ['wifi', 'Wi-Fi'],
            ['media', 'Media Player'],
            ['bluetooth', 'Bluetooth'],
            ['airplane', 'Airplane Mode'],
            ['focus', 'Focus / Do Not Disturb'],
            ['mirror', 'Mirror'],
            ['caffeine', 'Caffeine'],
            ['power', 'Power Mode'],
        ];
        const sizeKey = id => id === 'power' ? 'power-mode-tile-size' : `${id}-tile-size`;

        const listTiles = () => {
            const known = settings.get_value('known-toggles').deepUnpack();
            const tiles = [
                ...fixedTiles.map(([id, title]) => ({id, title})),
                ...Object.entries(known).map(([extra, title]) =>
                    ({id: `extra:${extra}`, extra, title})),
            ];
            const order = settings.get_strv('tile-order');
            const rank = ({id}) => {
                const index = order.indexOf(id);
                return index < 0 ? order.length : index;
            };
            return tiles.sort((x, y) => rank(x) - rank(y));
        };

        const getSize = tile => tile.extra
            ? settings.get_value('extra-tile-sizes').deepUnpack()[tile.extra]
            : settings.get_string(sizeKey(tile.id));

        const setSize = (tile, size) => {
            if (!tile.extra) {
                settings.set_string(sizeKey(tile.id), size);
                return;
            }
            const sizes = settings.get_value('extra-tile-sizes').deepUnpack();
            sizes[tile.extra] = size;
            settings.set_value('extra-tile-sizes', new GLib.Variant('a{ss}', sizes));
        };

        // Pindahkan tile yang diseret ke posisi tile tujuan.
        const moveTo = (id, targetId) => {
            const ids = listTiles().map(tile => tile.id);
            const from = ids.indexOf(id);
            const to = ids.indexOf(targetId);
            if (from < 0 || to < 0 || from === to)
                return false;
            ids.splice(from, 1);
            ids.splice(to, 0, id);
            settings.set_strv('tile-order', ids);
            return true;
        };

        const makeDragHandle = (row, id) => {
            const handle = new Gtk.Image({
                icon_name: 'list-drag-handle-symbolic',
                tooltip_text: 'Seret untuk mengubah urutan',
            });
            handle.set_cursor_from_name('grab');

            const source = new Gtk.DragSource({actions: Gdk.DragAction.MOVE});
            source.connect('prepare', () => {
                const value = new GObject.Value();
                value.init(GObject.TYPE_STRING);
                value.set_string(id);
                return Gdk.ContentProvider.new_for_value(value);
            });
            // Bayangan baris mengikuti kursor selama diseret.
            source.connect('drag-begin', () =>
                source.set_icon(new Gtk.WidgetPaintable({widget: row}), 20, 20));
            handle.add_controller(source);

            const target = Gtk.DropTarget.new(GObject.TYPE_STRING, Gdk.DragAction.MOVE);
            target.connect('drop', (_target, draggedId) => moveTo(draggedId, id));
            row.add_controller(target);
            return handle;
        };

        let rows = [];
        const rebuild = () => {
            for (const row of rows)
                tilesGroup.remove(row);
            const tiles = listTiles();
            rows = tiles.map(tile => {
                const row = new Adw.ComboRow({
                    title: tile.title,
                    use_markup: false,
                    model: Gtk.StringList.new(['Small', 'Medium', 'Large']),
                });
                row.selected = Math.max(0, sizeValues.indexOf(getSize(tile)));
                row.connect('notify::selected', () =>
                    setSize(tile, sizeValues[row.selected] ?? 'small'));

                row.add_prefix(makeDragHandle(row, tile.id));
                tilesGroup.add(row);
                return row;
            });
        };
        rebuild();

        // Disusun ulang setelah klik selesai diproses.
        let pending = 0;
        const queueRebuild = () => {
            pending ||= GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
                pending = 0;
                rebuild();
                return GLib.SOURCE_REMOVE;
            });
        };
        const signals = ['tile-order', 'known-toggles'].map(key =>
            settings.connect(`changed::${key}`, queueRebuild));
        window.connect('close-request', () => {
            for (const signal of signals)
                settings.disconnect(signal);
            if (pending)
                GLib.Source.remove(pending);
            pending = 0;
            return false;
        });

        const resetButton = new Gtk.Button({
            label: 'Reset urutan',
            valign: Gtk.Align.CENTER,
            css_classes: ['flat'],
        });
        resetButton.connect('clicked', () => settings.reset('tile-order'));
        tilesGroup.set_header_suffix(resetButton);
        page.add(tilesGroup);

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
