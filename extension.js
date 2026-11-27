import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import Pango from 'gi://Pango';
import {SystemController} from './system.js';
import {MediaController} from './media.js';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Slider from 'resource:///org/gnome/shell/ui/slider.js';

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
const MIRROR_UUID = 'mirror@distro.com';
const CAFFEINE_UUID = 'caffeine@patapon.info';
const CAFFEINE_TOGGLE_KEY = 'cli-toggle';

const SPANS = {small: [1, 1], medium: [2, 1], large: [2, 2]};
const STEP = SMALL + SPACING;

// Grid 4 kolom: setiap tile menempati slot kosong pertama yang muat.
function placeTiles(grid, tiles) {
    const used = new Set();
    let rows = 0;
    for (const {actor, size} of tiles) {
        const [w, h] = SPANS[size];
        const cells = (c, r) => Array.from({length: w * h},
            (_, i) => `${c + i % w},${r + Math.floor(i / w)}`);
        let col = 0, row = 0;
        while (col + w > 4 || cells(col, row).some(k => used.has(k))) {
            if (++col >= 4) {
                col = 0;
                row++;
            }
        }
        cells(col, row).forEach(k => used.add(k));
        rows = Math.max(rows, row + h);
        actor.set_position(col * STEP, row * STEP);
        actor.set_size(w * STEP - SPACING, h * STEP - SPACING);
    }
    grid.set_size(CONTENT_WIDTH, rows * STEP - SPACING);
}

// Tampilan isi tile sesuai ukurannya.
function styleTile(actor, size) {
    const small = size === 'small';
    const large = size === 'large';
    const padding = small ? '0' : size === 'medium' ? '0 13px' : '14px';
    actor.set_style(`border-radius: 29px; padding: ${padding};`);

    // Medium: ikon di kiri, teks di kanan.
    // Large: ikon di kiri atas, judul dan keterangan di kiri bawah.
    const content = actor._ccContent ?? actor;
    content.orientation = large
        ? Clutter.Orientation.VERTICAL : Clutter.Orientation.HORIZONTAL;
    if (actor._ccContent)
        content.y_align = large ? Clutter.ActorAlign.FILL : Clutter.ActorAlign.CENTER;

    const copy = actor._ccCopy;
    if (copy) {
        copy.visible = !small;
        copy.x_expand = true;
        copy.y_expand = false;
        copy.y_align = large ? Clutter.ActorAlign.END : Clutter.ActorAlign.CENTER;
        // Medium boleh dua baris; Large satu baris dengan elipsis.
        setLabelWrap(copy, !large);
    }
    // Tombol bulat hanya menampilkan keterangan di ukuran Large.
    if (actor._ccContent && actor._ccSubRow)
        actor._ccSubRow.visible = large;

    if (actor._ccSymbol) {
        const symbolSize = small ? 46 : large ? 40 : SYMBOL_SIZE;
        actor._ccSymbol.set_size(symbolSize, symbolSize);
        actor._ccSymbol.set_style('border-radius: 29px;');
        actor._ccSymbol.x_expand = small;
        actor._ccSymbol.y_expand = large;
        actor._ccSymbol.x_align = large ? Clutter.ActorAlign.START : Clutter.ActorAlign.CENTER;
        actor._ccSymbol.y_align = large ? Clutter.ActorAlign.START : Clutter.ActorAlign.CENTER;
    }
    if (actor._ccIcon)
        actor._ccIcon.set_icon_size(small ? 25 : large ? 22 : SYMBOL_ICON_SIZE);

    for (const option of Object.keys(SPANS))
        actor.remove_style_class_name(`cc-tile-size-${option}`);
    actor.add_style_class_name(`cc-tile-size-${size}`);
}

// Small: tombol Play saja. Medium: judul dan kontrol. Large: lengkap.
function styleMediaTile(tile, size) {
    const small = size === 'small';
    const large = size === 'large';
    const padding = small ? '0' : large ? '14px' : '4px 8px';
    tile.set_style(`border-radius: 29px; padding: ${padding}; spacing: ${large ? 5 : 0}px;`);

    tile._ccHeader.visible = !small;
    tile._ccHeader.x_align = large ? Clutter.ActorAlign.START : Clutter.ActorAlign.CENTER;
    tile._ccArtwork.visible = large;
    tile._ccArtistLabel.visible = large;
    tile._ccSpacer.visible = large;
    tile._ccPreviousButton.visible = !small;
    tile._ccNextButton.visible = !small;
    tile._ccControls.y_expand = !large;
    tile._ccControls.y_align = large ? Clutter.ActorAlign.FILL : Clutter.ActorAlign.CENTER;
    tile._ccPlayButton._ccIcon.icon_size = large || small ? 24 : 18;
    tile._ccPreviousButton._ccIcon.icon_size = large ? 22 : 16;
    tile._ccNextButton._ccIcon.icon_size = large ? 22 : 16;
}

function setLabelWrap(actor, wrap) {
    if (actor instanceof St.Label) {
        actor.clutter_text.line_wrap = wrap;
        actor.clutter_text.line_wrap_mode = Pango.WrapMode.WORD_CHAR;
        return;
    }
    for (const child of actor.get_children())
        setLabelWrap(child, wrap);
}

// Baris keterangan dengan penanda menu (panah atas-bawah).
function makeSubRow(tile, status) {
    const row = new St.BoxLayout({style_class: 'cc-subrow'});
    status.x_expand = false;
    const chevron = new St.Icon({
        gicon: mediaGicon('updown'),
        icon_size: 9,
        y_align: Clutter.ActorAlign.CENTER,
        visible: false,
    });
    row.add_child(status);
    row.add_child(chevron);
    tile._ccStatusLabel = status;
    tile._ccChevron = chevron;
    tile._ccSubRow = row;
    return row;
}

// Ratakan isi menu GNOME (termasuk section dan submenu) menjadi daftar biasa.
function collectMenuEntries(menu, entries = []) {
    for (const item of menu?._getMenuItems?.() ?? []) {
        if (item._getMenuItems) { // PopupMenuSection
            if (item.actor.visible)
                collectMenuEntries(item, entries);
            continue;
        }
        if (!item.visible)
            continue;
        if (item._mainSection) { // pembungkus per perangkat Wi-Fi
            collectMenuEntries(item._mainSection, entries);
            continue;
        }
        if (item.menu) { // submenu
            collectMenuEntries(item.menu, entries);
            continue;
        }
        const text = item.label?.text ?? item._label?.text;
        if (!text)
            continue; // separator
        const selected = Boolean(item._selectedIcon?.visible || item.state ||
            item._ornament === PopupMenu.Ornament.CHECK ||
            item._ornament === PopupMenu.Ornament.DOT);
        entries.push({item, text, selected});
    }
    return entries;
}

// Ikon media solid, ditanam langsung agar tidak bergantung pada tema ikon.
const MEDIA_SHAPES = {
    previous: 'M11.5 5v14L2 12zM22 5v14l-9.5-7z',
    play: 'M6 3.5v17L20.5 12z',
    pause: 'M5.5 4h4.5v16H5.5zM14 4h4.5v16H14z',
    next: 'M2 5l9.5 7L2 19zM12.5 5L22 12l-9.5 7z',
    updown: 'M12 4l5 5H7zM12 20l-5-5h10z',
};

function mediaGicon(shape) {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
        `<path fill="#ffffff" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round" d="${MEDIA_SHAPES[shape]}"/></svg>`;
    return Gio.BytesIcon.new(new GLib.Bytes(new TextEncoder().encode(svg)));
}

function label(text, styleClass) {
    return new St.Label({text, style_class: styleClass, x_expand: true});
}

function icon(name, size = 22, styleClass = 'cc-icon') {
    return new St.Icon({icon_name: name, icon_size: size, style_class: styleClass});
}

function setControlActive(actor, active) {
    if (!actor)
        return;
    if (active)
        actor.add_style_class_name('cc-control-active');
    else
        actor.remove_style_class_name('cc-control-active');
}

function makeSurface(styleClass, vertical = false) {
    return new St.BoxLayout({
        orientation: vertical ? Clutter.Orientation.VERTICAL : Clutter.Orientation.HORIZONTAL,
        x_expand: false,
        y_expand: false,
        style_class: `${SURFACE} ${styleClass}`,
    });
}

function makeWifiTile(onClick = null, onMenuClick = null) {
    const tile = makeSurface('cc-wifi-tile');
    tile.set_size(MEDIUM_WIDTH, MEDIUM_HEIGHT);

    // Ikon: klik kiri on/off, klik kanan membuka daftar jaringan.
    const symbol = new St.Button({
        reactive: true,
        can_focus: true,
        track_hover: true,
        button_mask: St.ButtonMask.ONE | St.ButtonMask.THREE,
        style_class: 'cc-symbol-disc',
        accessible_name: 'Toggle Wi-Fi',
    });
    symbol.set_size(SYMBOL_SIZE, SYMBOL_SIZE);
    symbol.set_x_align(Clutter.ActorAlign.CENTER);
    symbol.set_y_align(Clutter.ActorAlign.CENTER);
    const symbolIcon = icon('network-wireless-signal-excellent-symbolic', SYMBOL_ICON_SIZE);
    symbol.set_child(symbolIcon);
    symbol.connect('clicked', (_button, mouseButton) => {
        if (mouseButton === 3)
            onMenuClick?.();
        else
            onClick?.();
    });

    // Teks: klik membuka daftar jaringan.
    const text = new St.BoxLayout({
        orientation: Clutter.Orientation.VERTICAL,
        x_expand: true,
        y_align: Clutter.ActorAlign.CENTER,
        style_class: 'cc-copy',
    });
    const status = label('Connected', 'cc-subtitle');
    text.add_child(label('Wi-Fi', 'cc-title'));
    text.add_child(makeSubRow(tile, status));
    const copy = new St.Button({
        reactive: true,
        can_focus: true,
        track_hover: true,
        x_expand: true,
        accessible_name: 'Choose Wi-Fi network',
    });
    copy.set_child(text);
    copy.connect('clicked', () => onMenuClick?.());

    tile._ccIcon = symbolIcon;
    tile._ccStatusLabel = status;
    tile._ccSymbol = symbol;
    tile._ccCopy = copy;
    tile.add_child(symbol);
    tile.add_child(copy);
    return tile;
}

function makeCircle(name, accessibleName, onClick = null, onMenu = null) {
    const button = new St.Button({
        reactive: Boolean(onClick),
        can_focus: Boolean(onClick),
        track_hover: Boolean(onClick),
        style_class: `${SURFACE} cc-round-control`,
        button_mask: St.ButtonMask.ONE | St.ButtonMask.THREE,
        accessible_name: accessibleName,
    });
    button.set_size(SMALL, SMALL);

    const content = new St.BoxLayout({
        x_expand: true,
        y_expand: true,
        y_align: Clutter.ActorAlign.CENTER,
        style_class: 'cc-control-content',
    });
    const symbol = new St.Widget({
        layout_manager: new Clutter.BinLayout(),
        style_class: 'cc-symbol-disc cc-control-symbol',
    });
    symbol.set_size(SYMBOL_SIZE, SYMBOL_SIZE);
    symbol.set_style(`width: ${SYMBOL_SIZE}px; min-width: ${SYMBOL_SIZE}px; max-width: ${SYMBOL_SIZE}px; height: ${SYMBOL_SIZE}px; min-height: ${SYMBOL_SIZE}px; max-height: ${SYMBOL_SIZE}px; border-radius: 29px;`);
    button._ccIcon = icon(name, 25);
    button._ccIcon.set_x_align(Clutter.ActorAlign.CENTER);
    button._ccIcon.set_y_align(Clutter.ActorAlign.CENTER);
    symbol.add_child(button._ccIcon);
    button._ccLabel = label(accessibleName, 'cc-control-label');
    const info = new St.BoxLayout({
        orientation: Clutter.Orientation.VERTICAL,
        style_class: 'cc-copy',
    });
    info.add_child(button._ccLabel);
    info.add_child(makeSubRow(button, label('Off', 'cc-subtitle')));
    button._ccCopy = info;
    content.add_child(symbol);
    content.add_child(info);
    button.set_child(content);
    button._ccSymbol = symbol;
    button._ccContent = content;
    if (onClick) {
        button.connect('clicked', (_button, mouseButton) => {
            if (mouseButton !== 3)
                onClick();
            else
                onMenu?.();
        });
    }
    return button;
}

function makeFocusTile(onClick = null) {
    const tile = makeSurface('cc-focus-tile');
    tile.reactive = Boolean(onClick);
    tile.can_focus = Boolean(onClick);
    if (onClick) {
        tile.connect('button-press-event', () => {
            onClick();
            return Clutter.EVENT_STOP;
        });
    }
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
    const status = label('Do Not Disturb', 'cc-subtitle');
    copy.add_child(makeSubRow(tile, status));
    tile._ccIcon = symbolIcon;
    tile._ccStatusLabel = status;
    tile._ccSymbol = symbol;
    tile._ccCopy = copy;
    tile.add_child(symbol);
    tile.add_child(copy);
    return tile;
}

function makeMediaTile(onPrevious, onPlayPause, onNext) {
    const tile = makeSurface('cc-media-tile', true);
    tile.set_size(LARGE_WIDTH, LARGE_HEIGHT);
    tile.y_align = Clutter.ActorAlign.START;

    const header = new St.BoxLayout({
        orientation: Clutter.Orientation.VERTICAL,
        x_align: Clutter.ActorAlign.START,
        style_class: 'cc-media-header',
    });
    const artwork = new St.Widget({
        layout_manager: new Clutter.BinLayout(),
        style_class: 'cc-artwork',
    });
    artwork.set_size(37, 37);
    const artworkIcon = icon('audio-x-generic-symbolic', 20, 'cc-artwork-icon');
    artworkIcon.set_x_align(Clutter.ActorAlign.CENTER);
    artworkIcon.set_y_align(Clutter.ActorAlign.CENTER);
    artwork.add_child(artworkIcon);
    const heading = new St.BoxLayout({
        orientation: Clutter.Orientation.VERTICAL,
        y_align: Clutter.ActorAlign.CENTER,
        style_class: 'cc-media-copy',
    });
    const titleLabel = label('Not Playing', 'cc-media-title');
    const artistLabel = label('Your music', 'cc-subtitle');
    heading.add_child(titleLabel);
    heading.add_child(artistLabel);
    header.add_child(artwork);
    header.add_child(heading);
    const spacer = new St.Widget({y_expand: true});
    const controls = new St.BoxLayout({
        x_expand: true,
        style_class: 'cc-media-controls',
        x_align: Clutter.ActorAlign.CENTER,
    });
    const makeMediaButton = (shape, size, accessibleName, callback) => {
        const button = new St.Button({
            reactive: true,
            can_focus: true,
            track_hover: true,
            style_class: 'cc-media-control-button',
            accessible_name: accessibleName,
        });
        button._ccIcon = new St.Icon({gicon: mediaGicon(shape), icon_size: size});
        button.set_child(button._ccIcon);
        button.connect('clicked', callback);
        return button;
    };
    const previousButton = makeMediaButton(
        'previous', 22, 'Previous track', onPrevious);
    const playButton = makeMediaButton(
        'play', 24, 'Play or pause', onPlayPause);
    const nextButton = makeMediaButton(
        'next', 22, 'Next track', onNext);
    controls.add_child(previousButton);
    controls.add_child(playButton);
    controls.add_child(nextButton);
    tile._ccTitleLabel = titleLabel;
    tile._ccArtistLabel = artistLabel;
    tile._ccPlayButton = playButton;
    tile._ccPreviousButton = previousButton;
    tile._ccNextButton = nextButton;
    tile._ccHeader = header;
    tile._ccArtwork = artwork;
    tile._ccSpacer = spacer;
    tile._ccControls = controls;
    tile.add_child(header);
    tile.add_child(spacer);
    tile.add_child(controls);
    return tile;
}

function makeSliderTile(title, leadingIcon, trailingIcon, fillClass, onValueChanged = null, initialValue = 0.72, trailingAction = null) {
    const tile = new St.BoxLayout({
        orientation: Clutter.Orientation.VERTICAL,
        x_expand: true,
        style_class: `${SURFACE} cc-slider-tile`,
    });
    tile.set_size(CONTENT_WIDTH, SMALL);
    const heading = new St.BoxLayout({x_expand: true, style_class: 'cc-slider-heading'});
    heading.add_child(label(title, 'cc-slider-title'));
    tile._ccHeading = heading;
    tile.add_child(heading);
    const controls = new St.BoxLayout({
        x_expand: true,
        y_align: Clutter.ActorAlign.CENTER,
        style_class: 'cc-slider-controls',
    });
    controls.add_child(icon(leadingIcon, 15, 'cc-slider-icon'));
    const slider = new Slider.Slider(Math.max(0, Math.min(1, initialValue)));
    slider.x_expand = true;
    slider.y_align = Clutter.ActorAlign.CENTER;
    slider.accessible_name = title;
    // true saat nilai diubah oleh sistem, agar tidak dikirim balik ke sistem.
    let syncing = false;
    slider.connect('notify::value', () => {
        if (!syncing && onValueChanged)
            onValueChanged(slider.value);
    });
    tile._ccSetValue = value => {
        syncing = true;
        slider.value = Math.max(0, Math.min(1, value));
        syncing = false;
    };
    tile._ccSetEnabled = enabled => {
        slider.reactive = Boolean(enabled && onValueChanged);
        slider.can_focus = Boolean(enabled && onValueChanged);
        slider.opacity = enabled ? 255 : 110;
        if (tile._ccTrailingButton) {
            tile._ccTrailingButton.reactive = Boolean(enabled && trailingAction);
            tile._ccTrailingButton.opacity = enabled ? 255 : 110;
        }
    };
    controls.add_child(slider);
    if (trailingAction) {
        const trailingButton = new St.Button({
            reactive: true,
            can_focus: true,
            style_class: 'cc-slider-icon-button',
            accessible_name: 'Toggle mute',
        });
        trailingButton._ccIcon = icon(trailingIcon, 15, 'cc-slider-icon');
        trailingButton.set_child(trailingButton._ccIcon);
        trailingButton.connect('clicked', trailingAction);
        tile._ccTrailingButton = trailingButton;
        controls.add_child(trailingButton);
    } else {
        controls.add_child(icon(trailingIcon, 15, 'cc-slider-icon'));
    }
    tile.add_child(controls);
    return tile;
}

export default class ControlCenterExtension extends Extension {
    enable() {
        this._destroying = false;
        this._settings = this.getSettings();
        this._hideQuickSettingsSignal = this._settings.connect(
            'changed::hide-native-quick-settings',
            () => this._syncNativeQuickSettingsVisibility()
        );
        this._initCaffeineIntegration();
        this._mediaController = new MediaController(state => {
            this._mediaState = state;
            this._syncMediaState();
        });
        this._controller = new SystemController(state => {
            this._systemState = state;
            this._syncSystemState();
        });
        this._indicator = new PanelMenu.Button(0.0, this.metadata.name, false);
        this._indicator.add_style_class_name('cc-indicator');
        this._indicator.add_child(new St.Icon({
            gicon: new Gio.FileIcon({file: this.dir.get_child('control-center-symbolic.svg')}),
            icon_size: 22,
            style_class: 'system-status-icon',
        }));
        this._menuStateSignal = this._indicator.menu.connect(
            'open-state-changed',
            (menu, isOpen) => {
                this._watchExtraToggles(isOpen);
                if (isOpen)
                    this._indicator?.add_style_class_name('cc-active');
                else {
                    this._indicator?.remove_style_class_name('cc-active');
                    this._closeMenuOverlay();
                }
            }
        );
        this._indicator.menu.actor.add_style_class_name('cc-control-center-menu');
        this._buildMenu();
        Main.panel.addToStatusArea(this.uuid, this._indicator);
        this._placeAfterQuickSettings();
        this._queueQuickSettingsIntegration();
    }

    // Posisi default: tepat di sebelah kanan ikon Quick Settings.
    _placeAfterQuickSettings() {
        const anchor = Main.panel.statusArea.quickSettings?.container;
        const box = anchor?.get_parent();
        const {container} = this._indicator;
        if (!box)
            return;
        if (container.get_parent() !== box) {
            container.get_parent()?.remove_child(container);
            box.add_child(container);
        }
        box.set_child_above_sibling(container, anchor);
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
        this._content = content;
        this._connectTileSizeSettings();

        const grid = new St.Widget({layout_manager: new Clutter.FixedLayout()});
        this._grid = grid;

        this._wifiTile = makeWifiTile(
            () => this._controller.toggleWifi(),
            () => this._openWifiMenu()
        );
        this._mediaTile = makeMediaTile(
            () => this._mediaController.previous(),
            () => this._mediaController.playPause(),
            () => this._mediaController.next()
        );
        this._bluetoothButton = makeCircle(
            'bluetooth-active-symbolic', 'Bluetooth', () => this._controller.toggleBluetooth(),
            () => this._openBluetoothMenu());
        this._airplaneButton = makeCircle(
            'airplane-mode-symbolic', 'Airplane Mode', () => this._controller.toggleAirplaneMode());
        this._focusTile = makeFocusTile(() => this._controller.toggleFocus());
        this._mirrorButton = makeCircle(
            'phone-symbolic', 'Mirror Android device', () => this._openMirrorMenu());
        this._caffeineButton = makeCircle(
            'alarm-clock-symbolic', 'Caffeine Timer', () => this._openCaffeineMenu());
        this._syncCaffeineState();
        this._powerModeButton = makeCircle(
            'power-profile-balanced-symbolic', 'Power Mode', () => this._openPowerModeMenu());

        for (const tile of [this._powerModeButton, this._wifiTile, this._mediaTile, this._bluetoothButton,
            this._airplaneButton, this._focusTile, this._mirrorButton, this._caffeineButton])
            grid.add_child(tile);
        content.add_child(grid);

        this._brightnessTile = makeSliderTile(
            'Display', 'display-brightness-symbolic', 'weather-clear-symbolic', 'cc-brightness-fill',
            value => this._controller.setBrightness(value), 0.65);
        content.add_child(this._brightnessTile);
        this._volumeTile = makeSliderTile(
            'Sound', 'audio-volume-low-symbolic', 'audio-volume-high-symbolic', 'cc-volume-fill',
            value => this._controller.setVolume(value), 0.72,
            () => this._controller.toggleMute());
        content.add_child(this._volumeTile);
        const outputButton = new St.Button({
            can_focus: true,
            track_hover: true,
            accessible_name: 'Choose audio output',
        });
        outputButton.set_child(icon('pan-end-symbolic', 12, 'cc-slider-icon'));
        outputButton.connect('clicked', () => this._openSoundMenu());
        this._volumeTile._ccHeading.add_child(outputButton);

        const editControlRow = new St.BoxLayout({
            x_expand: true,
            style_class: 'cc-edit-control-row',
        });
        const editControlLeftSpacer = new St.Widget({x_expand: true});
        const editControlRightSpacer = new St.Widget({x_expand: true});
        const editControlButton = new St.Button({
            reactive: true,
            can_focus: true,
            track_hover: true,
            style_class: `${SURFACE} cc-edit-control-button`,
            accessible_name: 'Edit Control',
        });
        editControlButton.connect('clicked', () => this._openPreferences());
        editControlButton.set_size(86, 21);
        editControlButton.set_child(new St.Label({
            text: 'Edit Control',
            style_class: 'cc-edit-control-label',
        }));
        editControlRow.add_child(editControlLeftSpacer);
        editControlRow.add_child(editControlButton);
        editControlRow.add_child(editControlRightSpacer);
        content.add_child(editControlRow);
        this._editControlRow = editControlRow;

        const root = new St.Widget({layout_manager: new Clutter.BinLayout(), x_expand: true});
        root.add_child(content);
        root.add_child(this._buildPopup());
        this._root = root;
        item.add_child(root);
        this._menuItem = item;
        this._indicator.menu.addMenuItem(item);
        this._syncSystemState();
        this._applyAllTileSizes();
    }

    _syncSystemState() {
        const state = this._systemState;
        if (!state || this._destroying)
            return;

        if (this._wifiTile) {
            this._wifiTile._ccStatusLabel.text = state.wifiAvailable
                ? (state.wifiEnabled ? 'On' : 'Off') : 'Unavailable';
            this._wifiTile._ccIcon.icon_name = state.wifiEnabled
                ? 'network-wireless-signal-excellent-symbolic'
                : 'network-wireless-offline-symbolic';
            setControlActive(this._wifiTile, state.wifiEnabled);
        }

        if (this._bluetoothButton) {
            const glyph = this._bluetoothButton._ccIcon;
            if (glyph) {
                glyph.icon_name = state.bluetoothEnabled
                    ? 'bluetooth-active-symbolic' : 'bluetooth-disabled-symbolic';
            }
            this._bluetoothButton.accessible_name = state.bluetoothAvailable
                ? (state.bluetoothEnabled ? 'Bluetooth On' : 'Bluetooth Off')
                : 'Bluetooth unavailable';
            setControlActive(this._bluetoothButton,
                state.bluetoothAvailable && state.bluetoothEnabled);
        }

        if (this._airplaneButton) {
            const glyph = this._airplaneButton._ccIcon;
            if (glyph)
                glyph.icon_name = 'airplane-mode-symbolic';
            this._airplaneButton.accessible_name = state.airplaneEnabled
                ? 'Airplane Mode On' : 'Airplane Mode Off';
            this._airplaneButton.reactive = state.airplaneAvailable;
            setControlActive(this._airplaneButton, state.airplaneEnabled);
        }

        if (this._focusTile) {
            this._focusTile._ccStatusLabel.text = state.focusEnabled
                ? 'On' : 'Do Not Disturb';
            this._focusTile._ccIcon.icon_name = state.focusEnabled
                ? 'weather-clear-night-symbolic' : 'notifications-symbolic';
            setControlActive(this._focusTile, state.focusEnabled);
        }

        if (this._brightnessTile) {
            this._brightnessTile._ccSetEnabled(state.brightnessAvailable);
            if (state.brightnessAvailable)
                this._brightnessTile._ccSetValue(state.brightness);
        }

        if (this._volumeTile) {
            this._volumeTile._ccSetEnabled(state.audioAvailable);
            if (state.audioAvailable)
                this._volumeTile._ccSetValue(state.volume);
            const muteIcon = this._volumeTile._ccTrailingButton?._ccIcon;
            if (muteIcon)
                muteIcon.icon_name = state.muted
                    ? 'audio-volume-muted-symbolic' : 'audio-volume-high-symbolic';
        }
    }

    _queueQuickSettingsIntegration() {
        if (!this._settings?.get_boolean('hide-native-quick-settings')) {
            this._syncNativeQuickSettingsVisibility();
            return;
        }
        if (this._quickSettingsSource)
            return;

        // Control Center is the replacement UI. Keep GNOME's native Quick
        // Settings indicator hidden, but leave its actors and system services
        // untouched so all state remains owned by GNOME.
        let attempts = 0;
        this._quickSettingsSource = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            1,
            () => {
                attempts++;
                const quickSettings = Main.panel.statusArea.quickSettings;
                const container = quickSettings?.container;

                if (!container) {
                    if (attempts >= 20) {
                        this._quickSettingsSource = 0;
                        log('Control Center: native Quick Settings indicator was not available');
                        return GLib.SOURCE_REMOVE;
                    }
                    return GLib.SOURCE_CONTINUE;
                }

                this._nativeQuickSettings = quickSettings;
                this._setQuickSettingsLocked(quickSettings,
                    this._settings?.get_boolean('hide-native-quick-settings'));
                this._quickSettingsSource = 0;
                return GLib.SOURCE_REMOVE;
            }
        );
    }

    _connectTileSizeSettings() {
        this._tileSizeKeys = {
            wifi: 'wifi-tile-size',
            bluetooth: 'bluetooth-tile-size',
            airplane: 'airplane-tile-size',
            focus: 'focus-tile-size',
            media: 'media-tile-size',
            mirror: 'mirror-tile-size',
            caffeine: 'caffeine-tile-size',
            power: 'power-mode-tile-size',
        };
        this._tileSizeSignals = [];
        for (const key of [...Object.values(this._tileSizeKeys), 'extra-tile-sizes', 'tile-order']) {
            const signal = this._settings.connect(`changed::${key}`, () => {
                this._applyAllTileSizes();
            });
            this._tileSizeSignals.push(signal);
        }
        this._watchToggleRegistry();
    }

    // Daftarkan toggle Quick Settings tanpa menunggu Control Center dibuka.
    _watchToggleRegistry() {
        const queue = () => {
            if (this._registrySource)
                return;
            this._registrySource = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 2, () => {
                this._registrySource = 0;
                const grid = Main.panel.statusArea.quickSettings?.menu?._grid;
                if (grid && !this._registrySignal) {
                    this._registryGrid = grid;
                    this._registrySignal = grid.connect('child-added', queue);
                }
                this._syncExtraTiles();
                return GLib.SOURCE_REMOVE;
            });
        };
        queue();
    }

    _unwatchToggleRegistry() {
        if (this._registrySource)
            GLib.Source.remove(this._registrySource);
        this._registrySource = 0;
        if (this._registrySignal)
            this._registryGrid.disconnect(this._registrySignal);
        this._registrySignal = 0;
        this._registryGrid = null;
    }

    _applyAllTileSizes() {
        if (!this._grid || !this._settings)
            return;

        // Urutan default; urutan pilihan pengguna diterapkan di bawah.
        const tiles = [
            ['wifi', this._wifiTile],
            ['media', this._mediaTile],
            ['bluetooth', this._bluetoothButton],
            ['airplane', this._airplaneButton],
            ['focus', this._focusTile],
            ['mirror', this._mirrorButton],
            ['caffeine', this._caffeineButton],
        ].map(([name, actor]) => {
            const value = this._settings.get_string(this._tileSizeKeys[name]);
            const size = SPANS[value] ? value : 'small';
            if (name === 'media')
                styleMediaTile(actor, size);
            else
                styleTile(actor, size);
            return {id: name, actor, size};
        });
        const extraSizes = this._settings.get_value('extra-tile-sizes').deepUnpack();
        const addTile = (id, actor, value) => {
            const size = SPANS[value] ? value : 'small';
            styleTile(actor, size);
            tiles.push({id, actor, size});
        };
        addTile('power', this._powerModeButton,
            this._settings.get_string(this._tileSizeKeys.power));
        for (const {actor, id} of this._extraTiles ?? [])
            addTile(`extra:${id}`, actor, extraSizes[id]);

        // Tile yang belum ada di daftar urutan ditaruh di belakang.
        const order = this._settings.get_strv('tile-order');
        const rank = ({id}) => {
            const index = order.indexOf(id);
            return index < 0 ? order.length : index;
        };
        tiles.sort((a, b) => rank(a) - rank(b));
        placeTiles(this._grid, tiles);
        this._syncSubtitles();
    }

    _syncNativeQuickSettingsVisibility() {
        const quickSettings = Main.panel.statusArea.quickSettings;
        const container = quickSettings?.container;
        if (!container) {
            if (this._settings?.get_boolean('hide-native-quick-settings'))
                this._queueQuickSettingsIntegration();
            return;
        }

        this._nativeQuickSettings = quickSettings;
        this._setQuickSettingsLocked(quickSettings,
            this._settings?.get_boolean('hide-native-quick-settings'));
    }

    // Ikon tetap tampil di panel, tetapi popup-nya tidak bisa dibuka.
    _setQuickSettingsLocked(quickSettings, locked) {
        quickSettings.container.show();
        quickSettings.reactive = !locked;
        quickSettings.can_focus = !locked;
        quickSettings.track_hover = !locked;

        const {menu} = quickSettings;
        if (locked) {
            menu.close();
            // Keluarkan dari pengelola menu panel, agar tidak ikut terbuka saat
            // kursor digeser dari menu lain.
            Main.panel.menuManager.removeMenu(menu);
            // Tahan juga pemanggilan langsung, misalnya Super+S.
            menu.open = () => false;
            this._lockedMenu = menu;
        } else if (this._lockedMenu === menu) {
            delete menu.open;
            Main.panel.menuManager.addMenu(menu);
            this._lockedMenu = null;
        }
    }

    _restoreNativeQuickSettings() {
        if (this._quickSettingsSource) {
            GLib.Source.remove(this._quickSettingsSource);
            this._quickSettingsSource = 0;
        }

        if (this._nativeQuickSettings)
            this._setQuickSettingsLocked(this._nativeQuickSettings, false);
        this._nativeQuickSettings = null;
    }

    _showMenuOverlay(title, toggle) {
        this._closeMenuOverlay();
        if (!toggle?.menu || !this._root) {
            Main.notifyError(`${title} unavailable`, 'This menu is not available.');
            return;
        }

        const {scrim, titleLabel, list} = this._popup;
        titleLabel.text = title;
        list.destroy_all_children();
        // Tile disembunyikan (blur-nya ikut hilang) selama popup terbuka.
        this._content.opacity = 0;
        scrim.show();

        // Daftar Wi-Fi hanya dipindai kalau diminta.
        toggle._startScanning?.();

        let signature = null;
        const refresh = () => {
            const entries = collectMenuEntries(toggle.menu);
            const next = JSON.stringify(entries.map(e => [e.text, e.selected]));
            if (next === signature)
                return GLib.SOURCE_CONTINUE;
            signature = next;
            list.destroy_all_children();
            for (const entry of entries) {
                const row = new St.BoxLayout({x_expand: true});
                row.add_child(label(entry.text, 'cc-popup-label'));
                if (entry.selected)
                    row.add_child(icon('object-select-symbolic', 16));
                const button = new St.Button({
                    style_class: 'cc-popup-item',
                    can_focus: true,
                    track_hover: true,
                    x_expand: true,
                });
                button.set_child(row);
                button.connect('clicked', () => {
                    entry.item.activate(Clutter.get_current_event());
                    // Ditutup agar dialog password / Settings tidak terhalang.
                    this._indicator?.menu.close();
                });
                list.add_child(button);
            }
            if (!entries.length)
                list.add_child(label('Nothing to show yet', 'cc-popup-label'));
            return GLib.SOURCE_CONTINUE;
        };
        refresh();

        this._overlayState = {
            toggle,
            source: GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, refresh),
        };
    }

    _buildPopup() {
        // Scrim mencegah klik tembus ke tile di bawahnya.
        const scrim = new St.Widget({
            layout_manager: new Clutter.BinLayout(),
            reactive: true,
            x_expand: true,
            y_expand: true,
            visible: false,
        });
        const card = new St.BoxLayout({
            orientation: Clutter.Orientation.VERTICAL,
            style_class: `${SURFACE} cc-popup`,
            x_expand: true,
            y_expand: true,
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
        });
        const header = new St.BoxLayout({style_class: 'cc-popup-header'});
        const titleLabel = label('', 'cc-popup-title');
        header.add_child(titleLabel);
        const closeButton = new St.Button({can_focus: true, accessible_name: 'Close'});
        closeButton.set_child(icon('window-close-symbolic', 16));
        closeButton.connect('clicked', () => this._closeMenuOverlay());
        header.add_child(closeButton);

        const list = new St.BoxLayout({orientation: Clutter.Orientation.VERTICAL});
        const scroll = new St.ScrollView({style_class: 'cc-popup-scroll'});
        if (scroll.set_child)
            scroll.set_child(list);
        else
            scroll.add_actor(list);

        card.add_child(header);
        card.add_child(scroll);
        scrim.add_child(card);
        this._popup = {scrim, titleLabel, list};
        return scrim;
    }

    _closeMenuOverlay() {
        const state = this._overlayState;
        if (!state)
            return;
        this._overlayState = null;
        GLib.Source.remove(state.source);
        state.toggle._stopScanning?.();
        this._popup.scrim.hide();
        this._content.opacity = 255;
    }

    _openWifiMenu() {
        this._showMenuOverlay('Wi-Fi',
            Main.panel.statusArea.quickSettings?._network?._wirelessToggle);
    }

    _openBluetoothMenu() {
        this._showMenuOverlay('Bluetooth',
            Main.panel.statusArea.quickSettings?._bluetooth?.quickSettingsItems?.[0]);
    }

    _openSoundMenu() {
        this._showMenuOverlay('Sound Output',
            Main.panel.statusArea.quickSettings?._volumeOutput?.quickSettingsItems?.[0]);
    }

    _openPowerModeMenu() {
        this._showMenuOverlay('Power Mode',
            Main.panel.statusArea.quickSettings?._powerProfiles?.quickSettingsItems?.[0]);
    }

    // Toggle Quick Settings yang belum punya tile khusus.
    _findExtraToggles() {
        const quickSettings = Main.panel.statusArea.quickSettings;
        const handled = new Set([
            quickSettings?._network?._wirelessToggle,
            quickSettings?._bluetooth?.quickSettingsItems?.[0],
            quickSettings?._powerProfiles?.quickSettingsItems?.[0],
            quickSettings?._doNotDisturb?.quickSettingsItems?.[0],
            quickSettings?._rfkill?.quickSettingsItems?.[0],
            quickSettings?._backgroundApps?.quickSettingsItems?.[0],
            Main.extensionManager.lookup(CAFFEINE_UUID)?.stateObj
                ?._caffeineIndicator?.quickSettingsItems?.[0],
            Main.extensionManager.lookup(MIRROR_UUID)?.stateObj
                ?._indicator?.quickSettingsItems?.[0],
        ]);
        const items = quickSettings?.menu?._grid?.get_children() ?? [];
        return items.filter(item => item.visible && 'checked' in item &&
            item.title && !handled.has(item));
    }

    _syncExtraTiles() {
        if (this._destroying || !this._grid)
            return;

        const toggles = this._findExtraToggles();
        const current = this._extraTiles ?? [];
        const changed = toggles.length !== current.length ||
            toggles.some((toggle, i) => current[i].toggle !== toggle);

        if (changed) {
            for (const {actor} of current)
                actor.destroy();
            const seen = {};
            this._extraTiles = toggles.map(toggle => {
                // ID stabil untuk menyimpan ukuran; judul bisa berubah.
                const base = toggle.constructor.name || toggle.title;
                seen[base] = (seen[base] ?? 0) + 1;
                const id = seen[base] > 1 ? `${base}#${seen[base]}` : base;
                const actor = makeCircle('application-x-addon-symbolic', toggle.title,
                    () => this._activateToggle(toggle),
                    () => {
                        if (toggle.menu && toggle.menuEnabled !== false)
                            this._showMenuOverlay(toggle.title, toggle);
                    });
                this._grid.add_child(actor);
                return {actor, toggle, id};
            });
            this._applyAllTileSizes();
        }

        for (const {actor, toggle} of this._extraTiles) {
            if (toggle.gicon)
                actor._ccIcon.gicon = toggle.gicon;
            else if (toggle.icon_name)
                actor._ccIcon.icon_name = toggle.icon_name;
            actor.accessible_name = toggle.title;
            actor._ccLabel.text = toggle.title;
            setControlActive(actor, toggle.checked);
        }
        this._rememberToggles();
        this._syncSubtitles();
    }

    // Keterangan diambil dari toggle asli, misalnya nama Wi-Fi atau profil daya.
    _syncSubtitles() {
        const quickSettings = Main.panel.statusArea.quickSettings;
        const first = indicator => indicator?.quickSettingsItems?.[0];
        const extension = uuid => Main.extensionManager.lookup(uuid)?.stateObj;
        const entries = [
            [this._wifiTile, quickSettings?._network?._wirelessToggle, true],
            [this._bluetoothButton, first(quickSettings?._bluetooth), true],
            [this._airplaneButton, first(quickSettings?._rfkill), false],
            [this._focusTile, first(quickSettings?._doNotDisturb), false],
            [this._powerModeButton, first(quickSettings?._powerProfiles), true],
            [this._mirrorButton, first(extension(MIRROR_UUID)?._indicator), true],
            [this._caffeineButton, first(extension(CAFFEINE_UUID)?._caffeineIndicator), true],
            ...(this._extraTiles ?? []).map(({actor, toggle}) => [actor, toggle, true]),
        ];
        for (const [tile, toggle, canOpenMenu] of entries) {
            if (!tile?._ccStatusLabel)
                continue;
            if (toggle?.subtitle)
                tile._ccStatusLabel.text = toggle.subtitle;
            else if (toggle && tile._ccContent) // tombol bulat
                tile._ccStatusLabel.text = toggle.checked ? 'On' : 'Off';
            tile._ccChevron.visible = tile.has_style_class_name('cc-tile-size-large') &&
                Boolean(canOpenMenu && toggle?.menu && toggle.menuEnabled !== false);
        }
    }

    // Dicatat agar Preferences bisa menampilkan pilihan ukurannya.
    _rememberToggles() {
        if (!this._settings)
            return;
        const known = this._settings.get_value('known-toggles').deepUnpack();
        let changed = false;
        for (const {id, toggle} of this._extraTiles ?? []) {
            if (known[id] !== toggle.title) {
                known[id] = toggle.title;
                changed = true;
            }
        }
        if (changed)
            this._settings.set_value('known-toggles', new GLib.Variant('a{ss}', known));
    }

    _activateToggle(toggle) {
        // Sama seperti St.Button: toggle-mode membalik state sebelum 'clicked'.
        if (toggle.toggle_mode)
            toggle.checked = !toggle.checked;
        toggle.emit('clicked', 1);
        this._syncExtraTiles();
    }

    _watchExtraToggles(isOpen) {
        if (this._extraSource)
            GLib.Source.remove(this._extraSource);
        this._extraSource = 0;
        if (!isOpen)
            return;
        this._syncExtraTiles();
        this._extraSource = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
            this._syncExtraTiles();
            return GLib.SOURCE_CONTINUE;
        });
    }

    _openPreferences() {
        this._indicator?.menu.close();
        Main.extensionManager.openExtensionPrefs(this.uuid, '', {});
    }

    _initCaffeineIntegration() {
        if (this._caffeineSettings)
            return;
        try {
            const extension = Main.extensionManager.lookup(CAFFEINE_UUID);
            if (!extension?.stateObj)
                return;

            this._caffeineSettings = extension.stateObj.getSettings();
            this._caffeineSignal = this._caffeineSettings.connect(
                `changed::${CAFFEINE_TOGGLE_KEY}`,
                () => this._syncCaffeineState()
            );
        } catch (error) {
            logError(error, 'Unable to connect to Caffeine settings');
        }
    }

    _syncCaffeineState() {
        if (this._destroying || !this._caffeineButton || !this._caffeineSettings)
            return;

        const active = this._caffeineSettings.get_boolean(CAFFEINE_TOGGLE_KEY);
        const glyph = this._caffeineButton._ccIcon;
        if (glyph)
            glyph.icon_name = active ? 'alarm-clock-symbolic' : 'timer-symbolic';
        this._caffeineButton.opacity = 255;
        setControlActive(this._caffeineButton, active);
        this._caffeineButton.accessible_name = active
            ? 'Caffeine enabled. Click to disable'
            : 'Caffeine disabled. Click to enable';
    }

    _openCaffeineMenu() {
        this._initCaffeineIntegration();
        this._syncCaffeineState();
        const extension = Main.extensionManager.lookup(CAFFEINE_UUID);
        const caffeineToggle = extension?.stateObj?._caffeineIndicator
            ?.quickSettingsItems?.[0];

        this._showMenuOverlay('Caffeine', caffeineToggle);
    }

    _openMirrorMenu() {
        const extension = Main.extensionManager.lookup(MIRROR_UUID);
        const mirrorToggle = extension?.stateObj?._indicator
            ?.quickSettingsItems?.[0];

        this._showMenuOverlay('Mirror', mirrorToggle);
    }

    _syncMediaState() {
        const state = this._mediaState;
        if (!state || this._destroying || !this._mediaTile)
            return;
        this._mediaTile._ccTitleLabel.text = state.title;
        this._mediaTile._ccArtistLabel.text = state.artist;
        const playIcon = this._mediaTile._ccPlayButton._ccIcon;
        const playing = state.playbackStatus === 'Playing';
        if (playIcon)
            playIcon.gicon = mediaGicon(playing ? 'pause' : 'play');
        this._mediaTile._ccPlayButton.accessible_name = playing ? 'Pause' : 'Play';
        const canTogglePlayback = state.canPlay || state.canPause;
        this._mediaTile._ccPlayButton.reactive = canTogglePlayback;
        this._mediaTile._ccPlayButton.opacity = canTogglePlayback ? 255 : 110;
        this._mediaTile._ccPreviousButton.reactive = state.canGoPrevious;
        this._mediaTile._ccPreviousButton.opacity = state.canGoPrevious ? 255 : 110;
        this._mediaTile._ccNextButton.reactive = state.canGoNext;
        this._mediaTile._ccNextButton.opacity = state.canGoNext ? 255 : 110;
    }

    disable() {
        this._destroying = true;

        this._unwatchToggleRegistry();
        this._closeMenuOverlay();
        this._watchExtraToggles(false);

        if (this._settings && this._hideQuickSettingsSignal)
            this._settings.disconnect(this._hideQuickSettingsSignal);
        this._hideQuickSettingsSignal = 0;

        for (const signal of this._tileSizeSignals ?? [])
            this._settings?.disconnect(signal);
        this._tileSizeSignals = [];
        this._tileSizeKeys = null;

        if (this._caffeineSettings && this._caffeineSignal)
            this._caffeineSettings.disconnect(this._caffeineSignal);
        this._caffeineSignal = 0;
        this._caffeineSettings = null;

        this._restoreNativeQuickSettings();

        this._mediaController?.destroy();
        this._mediaController = null;
        this._controller?.destroy();
        this._controller = null;

        if (this._indicator && this._menuStateSignal)
            this._indicator.menu.disconnect(this._menuStateSignal);
        this._menuStateSignal = 0;

        // Destroy the menu item while its widget tree is still owned by the menu.
        // This also destroys the content, grid, popup and dynamically-created tiles.
        this._menuItem?.destroy();
        this._menuItem = null;
        this._extraTiles = [];
        this._content = null;
        this._grid = null;
        this._root = null;
        this._popup = null;
        this._editControlRow = null;

        this._settings = null;
        this._indicator?.destroy();
        this._indicator = null;
    }
}
