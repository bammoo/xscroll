define(function(require, exports, module) {
	var Util = require('../util');
	var Base = require('../base');
	var prefix;
	var containerCls;
	var content = "Pull Down To Refresh";
	var loadingContent = "Loading...";
	/**
	 * A pulldown to refresh plugin for xscroll.
	 * @constructor
	 * @param {object} cfg
	 * @extends {Base}
	 */
	var PullDown = function(cfg) {
		PullDown.superclass.constructor.call(this,cfg);
		this.userConfig = Util.mix({
			content: content,
			height: 60,
			autoRefresh: true, //是否自动刷新页面
			downContent: "Pull Down To Refresh",
			upContent: "Release To Refresh",
			loadingContent: loadingContent,
			prefix: "xs-plugin-pulldown-"
		}, cfg);
	}
	Util.extend(PullDown,Base, {
		/**
		 * a pluginId
		 * @memberOf PullDown
		 * @type {string} 
		 */
		pluginId: "pulldown",
		/**
		 * plugin initializer
		 * @memberOf PullDown
		 * @override Base
		 * @return {PullDown} 
		 */
		pluginInitializer: function(xscroll) {
			var self = this;
			self.xscroll = xscroll;
			prefix = self.userConfig.prefix;
			if (self.xscroll) {
				self.xscroll.on("afterrender", function() {
					self.render()
				})
			}
			return self;
		},
		/**
		 * detroy the plugin
		 * @memberOf PullDown
		 * @override Base
		 * @return {PullDown} 
		 */
		pluginDestructor: function() {
			var self = this;
			self.pulldown && self.pulldown.remove();
			self.xscroll.off("panstart", self._panStartHandler, self);
			self.xscroll.off("pan", self._panHandler, self);
			self.xscroll.off("panend", self._panEndHandler, self);
			self.__isRender = false;
			self._evtBinded = false;
			delete self;
		},
		/**
		 * render pulldown plugin
		 * @memberOf PullDown
		 * @return {PullDown} 
		 */
		render: function() {
			var self = this;
			if (self.__isRender) return;
			self.__isRender = true;
			var containerCls = prefix + "container";
			var height = self.userConfig.height || 60;
			var pulldown = self.pulldown = document.createElement("div");
			pulldown.className = containerCls;
			pulldown.style.position = "absolute";
			pulldown.style.width = "100%";
			pulldown.style.height = height + "px";
			pulldown.style.top = -height + "px";
			self.xscroll.container.appendChild(pulldown);
			Util.addClass(pulldown, prefix + self.status);
			pulldown.innerHTML = self.userConfig[self.status + "Content"] || self.userConfig.content;
			self._bindEvt();
			return self;
		},
		_bindEvt: function() {
			var self = this;
			if (self._evtBinded) return;
			self._evtBinded = true;
			var pulldown = self.pulldown;
			var xscroll = self.xscroll;
			xscroll.on("pan", self._panHandler,self);
			xscroll.on("panstart", self._panStartHandler,self);
			xscroll.on("panend",self._panEndHandler,self);
		},
		_changeStatus: function(status) {
			var prevVal = this.status;
			this.status = status;
			Util.removeClass(this.pulldown, prefix + prevVal)
			Util.addClass(this.pulldown, prefix + status);
			this.pulldown.innerHTML = this.userConfig[status + "Content"];
			if(prevVal != status){
				this.trigger("statuschange",{
					prevVal:prevVal,
					newVal:status
				});
				if(status == "loading"){
					this.trigger("loading");
				}
			}
		},
		/**
		 * reset the pulldown plugin
		 * @memberOf PullDown
		 * @param {function} callback 
		 * @return {PullDown} 
		 */
        reset:function(callback){
        	this.xscroll.boundry.resetTop()
			this.xscroll.bounce(true, callback);
			this._expanded = false;
			return this;
        },
		_panStartHandler: function(e) {
			clearTimeout(this.loadingItv);
		},
		_panHandler: function(e) {
			var self = this;
			var height = self.userConfig.height || 60;
			if (e.scrollTop > 0) return;
			self._changeStatus(Math.abs(e.scrollTop) < height ? "down" : "up");
		},
		_panEndHandler: function(e) {
			var self = this;
			var xscroll = self.xscroll;
			var height = self.userConfig.height || 60;
			var scrollTop = xscroll.getScrollTop();
			if (scrollTop < -height) {
				//prevent default bounce
				e.preventDefault();
				xscroll.boundry.resetTop();
				xscroll.boundry.expandTop(height);
				xscroll.boundryCheckY(function(){
					self._changeStatus("loading");
				});
				if(self.userConfig.autoRefresh){
					clearTimeout(self.loadingItv);
					self.loadingItv = setTimeout(function() {
						xscroll.boundry.resetTop();
						xscroll.boundryCheckY(function() {
							window.location.reload();
						})
					}, 800);
				}
			}
		}
	});

	if(typeof module == 'object' && module.exports){
		module.exports = PullDown;
	}
});