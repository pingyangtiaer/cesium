/*global define*/
define([
    '../../Core/Check',
    '../../Core/defined',
    '../../Core/defineProperties',
    '../../Core/destroyObject',
    '../../ThirdParty/knockout',
    '../getElement',
    '../CesiumInspector/Cesium3DTilesInspectorViewModel'
    ], function(
        Check,
        defined,
        defineProperties,
        destroyObject,
        knockout,
        getElement,
        Cesium3DTilesInspectorViewModel) {
    'use strict';

    /**
     * Inspector widget to aid in debugging 3D tiles
     *
     * @alias Cesium3DTilesInspector
     * @constructor
     *
     * @param {Element|String} container The DOM element or ID that will contain the widget.
     * @param {Scene} scene the Scene instance to use.
     *
     * @exception {DeveloperError} container is required.
     * @exception {DeveloperError} scene is required.
     */
    function Cesium3DTilesInspector(container, scene) {
        //>includeStart('debug', pragmas.debug);
        Check.defined(container, 'container');
        Check.typeOf.object(scene, 'scene');
        //>>includeEnd('debug');

        container = getElement(container);
        var that = this;
        var viewModel = new Cesium3DTilesInspectorViewModel(scene);
        this._viewModel = viewModel;
        this._container = container;

        this._inspectorModel = {
            inspectorVisible: true,
            tilesetVisible: false,
            displayVisible: false,
            updateVisible: false,
            loggingVisible: false,
            styleVisible: false,
            toggleInspector: function() {
                that._inspectorModel.inspectorVisible = !that._inspectorModel.inspectorVisible;
            },
            toggleTileset: function() {
                that._inspectorModel.tilesetVisible = !that._inspectorModel.tilesetVisible;
            },
            toggleDisplay: function() {
                that._inspectorModel.displayVisible = !that._inspectorModel.displayVisible;
            },
            toggleUpdate: function() {
                that._inspectorModel.updateVisible = !that._inspectorModel.updateVisible;
            },
            toggleLogging: function() {
                that._inspectorModel.loggingVisible = !that._inspectorModel.loggingVisible;
            },
            toggleStyle: function() {
                that._inspectorModel.styleVisible = !that._inspectorModel.styleVisible;
            }
        };

        knockout.track(this._inspectorModel, ['inspectorVisible', 'tilesetVisible', 'displayVisible', 'updateVisible', 'loggingVisible', 'styleVisible']);

        var element = document.createElement('div');
        this._element = element;
        var text = document.createElement('div');
        text.textContent = '3D Tiles Inspector';
        text.className = 'cesium-cesiumInspector-button';
        text.setAttribute('data-bind', 'click: toggleInspector');
        element.appendChild(text);
        element.className = 'cesium-cesiumInspector';
        element.setAttribute('data-bind', 'css: { "cesium-cesiumInspector-visible" : inspectorVisible, "cesium-cesiumInspector-hidden" : !inspectorVisible }');
        container.appendChild(this._element);

        var tilesetPanel = makeSection('Tileset', 'tilesetVisible', 'toggleTileset');
        var displayPanel = makeSection('Display', 'displayVisible', 'toggleDisplay');
        var updatePanel = makeSection('Update', 'updateVisible', 'toggleUpdate');
        var loggingPanel = makeSection('Logging', 'loggingVisible', 'toggleLogging');
        var stylePanel = makeSection('Style', 'styleVisible', 'toggleStyle');

        // first add and bind all the toggleable panels
        element.appendChild(tilesetPanel);
        element.appendChild(displayPanel);
        element.appendChild(updatePanel);
        element.appendChild(loggingPanel);
        element.appendChild(stylePanel);
        knockout.applyBindings(this._inspectorModel, element);

        // build and bind each panel separately
        var tilesetURL = document.createElement('div');
        tilesetURL.setAttribute('data-bind', 'html: tilesetURL');
        tilesetURL.setAttribute('style', 'word-break: break-all;');
        tilesetPanel.contents.appendChild(tilesetURL);
        tilesetPanel.contents.appendChild(makeButton('_togglePickTileset', 'Pick Tileset', '_pickActive'));
        tilesetPanel.contents.appendChild(makeButton('trimTilesCache', 'Trim Tiles Cache'));
        tilesetPanel.contents.appendChild(makeCheckbox('picking', 'Enable Picking'));
        knockout.applyBindings(viewModel, tilesetPanel.contents);


        displayPanel.contents.appendChild(makeCheckbox('colorize', 'Colorize'));
        displayPanel.contents.appendChild(makeCheckbox('wireframe', 'Wireframe'));
        displayPanel.contents.appendChild(makeCheckbox('showBoundingVolumes', 'Bounding Volumes'));
        displayPanel.contents.appendChild(makeCheckbox('showContentBoundingVolumes', 'Content Volumes'));
        displayPanel.contents.appendChild(makeCheckbox('showRequestVolumes', 'Request Volumes'));
        knockout.applyBindings(viewModel, displayPanel.contents);


        updatePanel.contents.appendChild(makeCheckbox('suspendUpdates', 'Suspend Updates'));
        updatePanel.contents.appendChild(makeCheckbox('dynamicSSE', 'Dynamic SSE'));
        var sseContainer = document.createElement('div');
        sseContainer.setAttribute('data-bind', 'css: {"cesium-cesiumInspector-show" : !dynamicSSE, "cesium-cesiumInspector-hide" : dynamicSSE}');
        sseContainer.appendChild(makeRangeInput('maximumSSE', 0, 128, 0.5, 'Maximum SSE'));
        updatePanel.contents.appendChild(sseContainer);

        var dynamicSSEContainer = document.createElement('div');
        dynamicSSEContainer.setAttribute('data-bind', 'css: {"cesium-cesiumInspector-show" : dynamicSSE, "cesium-cesiumInspector-hide" : !dynamicSSE}');
        dynamicSSEContainer.appendChild(makeRangeInput('dynamicSSEDensity', 0, 1, 0.01, 'SSE Density'));
        dynamicSSEContainer.appendChild(makeRangeInput('dynamicSSEFactor', 0, 10, 0.1, 'SSE Factor'));
        updatePanel.contents.appendChild(dynamicSSEContainer);
        knockout.applyBindings(viewModel, updatePanel.contents);

        loggingPanel.contents.appendChild(makeCheckbox('performance', 'Performance'));
        loggingPanel.contents.appendChild(this._viewModel._performanceDisplay._container);
        this._viewModel._performanceDisplay._container.setAttribute('data-bind', 'css: {"cesium-cesiumInspector-show" : performance, "cesium-cesiumInspector-hide" : !performance}');
        loggingPanel.contents.appendChild(makeCheckbox('showStats', 'Stats'));
        var stats = document.createElement('div');
        stats.setAttribute('data-bind', 'html: statsText, css: {"cesium-cesiumInspector-show" : showStats, "cesium-cesiumInspector-hide" : !showStats}');
        stats.setAttribute('style', 'font-size: 11px');
        loggingPanel.contents.appendChild(stats);
        loggingPanel.contents.appendChild(makeCheckbox('showPickStats', 'Pick Stats'));
        var pickStats = document.createElement('div');
        pickStats.setAttribute('data-bind', 'html: pickStatsText, css: {"cesium-cesiumInspector-show" : showPickStats, "cesium-cesiumInspector-hide" : !showPickStats}');
        pickStats.setAttribute('style', 'font-size: 11px');
        loggingPanel.contents.appendChild(pickStats);
        knockout.applyBindings(viewModel, loggingPanel.contents);

        var styleEditor = document.createElement('textarea');
        styleEditor.setAttribute('data-bind', 'value: styleString');
        stylePanel.contents.className = 'cesium-cesiumInspector-styleEditor';
        stylePanel.contents.appendChild(styleEditor);
        stylePanel.contents.appendChild(document.createElement('br'));
        var closeStylesBtn = makeButton('toggleStyle', 'Close');
        stylePanel.contents.appendChild(closeStylesBtn);
        knockout.applyBindings(this._inspectorModel, closeStylesBtn);
        knockout.applyBindings(viewModel, styleEditor);
    }

    defineProperties(Cesium3DTilesInspector.prototype, {
        /**
         * Gets the parent container.
         * @memberof Cesium3DTilesInspector.prototype
         *
         * @type {Element}
         */
        container : {
            get : function() {
                return this._container;
            }
        },

        /**
         * Gets the view model.
         * @memberof Cesium3DTilesInspector.prototype
         *
         * @type {Cesium3DTilesInspectorViewModel}
         */
        viewModel : {
            get : function() {
                return this._viewModel;
            }
        }
    });

    /**
     * Sets the callback function to call on tileset load
     *
     * @param {Function} callback the callback
     */
    Cesium3DTilesInspector.prototype.onLoad = function(callback) {
        this._onLoad = callback;
    };

    /**
     * Sets the callback function to call on tileset unload
     *
     * @param {Function} callback the callback
     */
    Cesium3DTilesInspector.prototype.onUnload = function(callback) {
        this._onUnload = callback;
    };

    /**
     * Sets the callback function to call on feature selection
     *
     * @param {Function} callback the callback
     */
    Cesium3DTilesInspector.prototype.onSelect = function(callback) {
        this._onSelect = callback;
    };

    /**
     * @returns {Boolean} true if the object has been destroyed, false otherwise.
     */
    Cesium3DTilesInspector.prototype.isDestroyed = function() {
        return false;
    };

    /**
     * Destroys the widget.  Should be called if permanently
     * removing the widget from layout.
     */
    Cesium3DTilesInspector.prototype.destroy = function() {
        knockout.cleanNode(this._element);
        this._container.removeChild(this._element);
        this.viewModel.destroy();

        return destroyObject(this);
    };

    function makeSection(name, visibleProp, toggleProp) {
        var panel = document.createElement('div');
        panel.className = 'cesium-cesiumInspector-dropDown';

        var header = document.createElement('div');
        header.className = 'cesium-cesiumInspector-sectionHeader';
        var toggle = document.createElement('span');
        toggle.className = 'cesium-cesiumInspector-toggleSwitch';

        var bindings = [];
        if (defined(toggleProp)) {
            if (defined(visibleProp)) {
                bindings.push('text: ' + visibleProp + ' ? "-" : "+"');
            }
            bindings.push('click: ' + toggleProp);
        }

        toggle.setAttribute('data-bind', bindings.join(', '));
        header.appendChild(toggle);
        header.appendChild(document.createTextNode(name));

        var section = document.createElement('div');
        section.className = 'cesium-cesiumInspector-section';
        if (defined(visibleProp)) {
            section.setAttribute('data-bind', 'css: {"cesium-cesiumInspector-show" : ' + visibleProp + ', "cesium-cesiumInspector-hide" : !' + visibleProp + '}');
        }

        panel.appendChild(header);
        panel.appendChild(section);

        var contents = document.createElement('div');
        section.appendChild(contents);
        panel.contents = contents;
        return panel;
    }

    function makeCheckbox(property, text, enable) {
        var container = document.createElement('div');
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        var binding = 'checked: ' + property;
        if (defined(enable)) {
            binding += ', enable: ' + enable;
        }
        checkbox.setAttribute('data-bind', binding);
        container.appendChild(checkbox);
        container.appendChild(document.createTextNode(text));
        return container;
    }

    function makeRangeInput(property, min, max, step, text) {
        var container = document.createElement('div');
        container.className = 'cesium-cesiumInspector-slider';
        var input = document.createElement('input');
        input.setAttribute('data-bind', 'value: ' + property);
        input.type = 'number';

        var slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.step = step;
        slider.setAttribute('data-bind', 'value: ' + property);

        container.appendChild(document.createTextNode(text));
        var wrapper = document.createElement('div');
        wrapper.appendChild(input);
        wrapper.appendChild(slider);
        container.appendChild(wrapper);

        return container;
    }

    function makeButton(action, text, active) {
        var button = document.createElement('input');
        button.type = 'button';
        button.value = text;
        button.className = 'cesium-cesiumInspector-pickButton';
        var binding = 'click: ' + action;
        if (defined(active)) {
            binding += ', css: {"cesium-cesiumInspector-pickButtonHighlight" : ' + active + '}';
        }
        button.setAttribute('data-bind', binding);


        return button;
    }

    return Cesium3DTilesInspector;
});
