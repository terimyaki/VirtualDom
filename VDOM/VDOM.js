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
		this._state;
		//Interface variables
		this.children = children;
		this.tag = tag;
		this.attrs = attrs;
		this.dirty = true;
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
		else this.attrs.className += ' ' + className;
	}
	get children(){
		return this._children;
	}
	set children(children){
		if(!children && children !== 0) children = null;
		this._children = children;
	}
	get state(){
		return this._state;
	}
	set state(state){
		if(this.attrs && state){
			let self = this,
				attrs = this.attrs;
			Object.keys(attrs).forEach((key) => {
				if(attrs[key] instanceof Function) {
					let func = attrs[key];
					attrs[key] = (event) => {
						console.log('func', func, 'this is event', event, 'this is this', this);
						func.call(self, event);
						self.dirty = true;
						console.log(self);
						self.rerender();
					};
				}
			});
		}
		this._state = state;
	}
	render(rerenderFunc, dataId) {
		if(!dataId) dataId = [];
		if(!this.rerender) this.rerender = rerenderFunc;
		console.log('this is the rerender', this.rerender, 'and this is the render func', rerenderFunc);
		let element;
		//Handles the tag
		if(typeof this.tag === 'string') element = $(document.createElement(this.tag));
		else if (this.tag instanceof Component) element = this.tag.render(this.rerender, dataId);

		//Handles the attributes
		element = parseAttrs(this.attrs, element);

		//Handles the children
		if(this.children !== null){
			if(typeof this.children === 'string' || typeof this.children === 'number') element.text(this.children);
			else if(this.children instanceof Component) element.append(this.children.render(this.rerender, [].concat(dataId, 0)));
			else if(this.children instanceof Array) this.children.map(function(child){
				if(child instanceof Function) return child();
				else if(typeof child === 'string' || typeof child === 'number') return new Component('p', null, child);
				return child;
			}).forEach(function(childEl, elIndex){
				element.append(childEl.render(this.rerender, [].concat(dataId, elIndex)));
			});
		}
		element.attr('data-id', createDataId(dataId));
		if(this.attrs) this.attrs['data-id'] = createDataId(dataId);
		else this.attrs = {['data-id'] : createDataId(dataId)};

		//Returns the element
		return element;
	}
	attachState(state){
		this.state = state;
		if(this.children instanceof Array) this.children.forEach((child) => child.state = state);
	}
}

class DomClass {
	constructor(className, options){
		this._name;
		this.name = className;
		Object.keys(options).forEach((key) => this[key] = options[key]);

		if(this.setState) this.state = this.setState();

		let component = options.render.call(this);
		component.addClass(this.name);
		if(this.state) component.attachState(this.state);
		return component;
	}
	get name(){
		return this._name;
	}
	set name(name){
		if(!name) throw new SyntaxError('Need a valid class name on creation.');
		this._name = kebabCase(name);
	}
}

let createElement = (tag, attrs, children) => {
	return new Component(tag, attrs, children);
};

let createClass = (className, options) => {
	if(!className) throw new SyntaxError('Need a valid class name on creation.');
	return () => new DomClass(className, options);
};

let render = function(element, attachTo){
	if(!attachTo) throw new SyntaxError('Need a valid DOM specified on creation.');
	let reRender = function(element, attachTo){
		var $attachTo = $(attachTo);
		return function(){
			$attachTo.empty();
			$attachTo.append(element.render());
		};
	}
	$(attachTo).append(element.render(reRender(element, attachTo)));
};

export {Component, createElement, createClass, render};