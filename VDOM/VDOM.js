// make sure to module export
//module.exports = ????;
'use strict';
import {kebabCase} from 'lodash';
import $ from 'jquery';

function createDataId(dataId){ 
	return dataId.reduce(function(prev, id){
		return prev + '.' + id;
	}, '.0');
}

function parseAttrs(attrs, $element){
	if(attrs) {
		Object.keys(attrs).forEach((key) => {
			if(key === 'className') attrs.className.split(' ').forEach((name) => $element.addClass(name));
			else $element.attr(key.toLowerCase(), attrs[key]);
		});
	}
	return $element;
}

class Component {
	constructor(tag, attrs, children){
		//Actual variables
		this._tag;
		this._attrs;
		this._children;
		this._events;
		//Interface variables
		this.children = children;
		this.tag = tag;
		this.attrs = attrs;
	}

	get tag(){
		return this._tag;
	}
	set tag(tag) {
		if(!tag) throw new SyntaxError('Need a valid tag.');
		if(tag instanceof Function) tag = tag();
		this._tag = tag;
	}
	get attrs(){
		return this._attrs;
	}
	set attrs(attrs){
		if(!attrs) attrs = null;
		else if(attrs.hasOwnProperty('className') && attrs.className) attrs.className = attrs.className.split(' ').map((name) => kebabCase(name)).join(' ');
		this._attrs = attrs;
	}
	addClass(className) {
		if(!this.attrs) this.attrs = {className};
		else if(!this.attrs.hasOwnProperty('className') || !this.attrs.className) this.attrs.className = className.split(' ').map((name) => kebabCase(name)).join(' ');
		else this.attrs.className += ' ' + kebabCase(className);
	}
	get children(){
		return this._children;
	}
	set children(children){
		if(!children && children !== 0) children = null;
		this._children = children;
	}
	render(dataId) {
		if(!dataId) dataId = [];
		var element;
		//Handles the tag
		if(typeof this.tag === 'string') element = $(document.createElement(this.tag));
		else if (this.tag instanceof Component) element = this.tag.render(dataId);

		//Handles the attributes
		element = parseAttrs(this.attrs, element);

		//Handles the children
		if(this.children !== null){
			if(typeof this.children === 'string' || typeof this.children === 'number') element.text(this.children);
			else if(this.children instanceof Component) element.append(this.children.render([].concat(dataId, 0)));
			else if(this.children instanceof Array) this.children.map(function(child){
				if(child instanceof Function) return child();
				else if(typeof child === 'string' || typeof child === 'number') return new Component('p', null, child);
				return child;
			}).forEach(function(childEl, elIndex){
				element.append(childEl.render([].concat(dataId, elIndex)));
			});
		}

		element.attr('data-id', createDataId(dataId));
		if(this.attrs) this.attrs['data-id'] = createDataId(dataId);
		else this.attrs = {['data-id'] : createDataId(dataId)};

		//Returns the element
		return element;
	}
}

let createElement = (tag, attrs, children) => {
	return new Component(tag, attrs, children);
};

let createClass = (className, options) => {
	if(!className) throw new SyntaxError('Need a valid class name on creation.');
	return () => {
		var init = {};
		if(options.hasOwnProperty('setState')) init.state = options.setState();
		if(options.hasOwnProperty('tick')) init.tick = options.tick;
		var oldEl = options.render.call(init);
		console.log('this is the oldEl', oldEl);
		oldEl.addClass(className);
		return oldEl;
	};
};

let render = function(element, attachTo){
	if(!attachTo) throw new SyntaxError('Need a valid DOM specified on creation.');
	$(attachTo).append(element.render());
};

export {Component, createElement, createClass, render};