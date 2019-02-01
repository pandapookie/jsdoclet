# JsDoclet : template for JSDoc 3

<i>(document également disponible en [français :fr:](README_FR.md))</i>



## Summary

<!-- logo JsDoclet -->
<div style="width: 8ex; height: 8ex; transform: rotate(-45deg); float: left; margin: 1ex 2ex 1ex 1ex"><div style="background-color: #048; width: 100%; height: 50%; border-radius: 4ex 4ex 0 0"></div><div style="background-color: #EEE; width: 100%; height: 50%; border-radius: 0 0 4ex 4ex"></div></div>


_JsDoclet_ is a template frame for [JSDoc 3][jsdoc].
It offer filtering and treatment items mecanics and final export of results.

This template depends on the [TaffyDB][taffydb] library.

<!-- TODO
- possibilité de surcharge
- possibilité de surcharge des constructeurs
- catégories
- ne prend pas en compte les tags de compile closure
-->


## Contents

* [Installation](#Installation)
* [Use](#Use)
	* [Entry point example](#Entry-point-example)
* [Supported tags list](#Supported-tags-list)
* [How its work ?](#How-its-work-)
* [Usefull links](#Usefull-links)



## Installation

Section under construction. <!-- TODO -->



## Use

1. Create your own class inherited from `JsDoclet`.
2. Override methods `to*Something*` as you want to perform some transformations
   over the items.
3. Override methods `beforeTreatment` and `printDataOut` if needed.
4. Create an entry point of your template, create an instance object of your
   class with your options and call the `run` method.
5. Admire the result and congratulate yourself :)



### Entry point example

```javascript
exports.publish = function (data, opts) {
	// create your template with your options
	var template = new MyJsDoclet (opts);

	// run the template
	template.run (data);
	// This method :
	// 1) called "beforeTreatment" with "data"
	// 2) called methods "to*Something*" for each element to treat
	// 3) called "printDataOut" to exports results
};
```



## Supported tags list

_JsDoclet_ doesn't support all jsdoc tags. See the table below to now how each
of them are supported

Total | Partial | To come /<br>unknown behavior
--- | --- | ---
\@callback<br>\@class, \@constructor<br>\@file, \@overview, \@fileoverview<br>\@enum<br>\@event<br>\@func, \@function, \@method<br>\@ignore<br>\@inheritdoc<br>\@interface<br>\@member, \@var<br>\@namespace<br>\@override | \@mixin | \@constructs<br>\@exports<br>\@external<br>\@generator<br>\@hideconstructor<br>\@mixes<br>\@module<br>\@prop, \@property<br>\@readonly<br>\@requires<br>\@this<br>\@todo<br>\@tutorial<br>\@variation<br>\@yields, \@yield


No tag exclusive to [Closure Compiler tags](https://github.com/google/closure-compiler/wiki/Annotating-JavaScript-for-the-Closure-Compiler) are supported.



## How its work ?

_JsDoclet_ proceeds in three steps:

1) Pre-treatment of elements recieved from JSDoc 3;
2) Scan of each element :
	- corresponding `to*Something*` method is called;
	- then transformed element is graft to its parent;
3) Post-treatment and export of transformed elements.

These three steps are performed when you call the `run` method.

By default :

- Pre-treatment deletes some elements through a [TaffyDB][taffydb] query
  described in `userOptions.removeQuery`;
- Each `to*Something*` methods print its name and the name of the recieved
  element. The name of an element is the value of its `longname` property or
  else its `name` property;
- There don't are any post-treatment, only display of transformed elements
  on the standard output through `console.log`.

Fore more explanations, see the file [HOWTO.md][howtoen].



## Usefull links


* :fr: Ce fichier en [français](README_FR.md)
* JSDoc 3 : [documentation](http://usejsdoc.org/) and [git repository][jsdoc]
* [TaffyDB][taffydb] official website
* [JsDoclet](doc/index.html) documentation
* More explanations about the template : file [HOWTO.md][howtoen]
* [Haruki][haruki], on which _JsDoclet_ is based



<!--### LINKS ###############################################################-->

[jsdoc]:https://github.com/jsdoc3/jsdoc "Dépôt git officiel de JSDoc 3"
[taffydb]:http://taffydb.com/ "Site officiel de TaffyDB"
[haruki]: https://github.com/jsdoc3/jsdoc/tree/master/templates/haruki ""
[howtoen]:HOWTO.md "Consulter le fichier de fonctionnement de JsDoclet"
