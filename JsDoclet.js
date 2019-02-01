/**
 * JsDoclet.js
 *
 * @author Pookie <>
 * @overview created: Thu, 24 May 2018 20:50:25 +0200
 */
JsDoclet.prototype.constructor = JsDoclet;



//##############################################################################
//	Constructor
//##############################################################################



/**
 * @class
 * @classdesc Base class of a JavaScript doclet for JSDoc 3.
 *
 * This doclet run in three steps:
 * <ol>
 *   <li>
 *     Proceeds a pre-treatment on elements from JSDoc 3 recieved data (see
 *     {@link beforeTreatment} method).
 *   </li>
 *   <li>
 *     Scans each element: call the appropriate "to*Something*" method to
 *     transform it and affiliate it to its parent (see {@link graft} method).
 *   </li>
 *   <li>
 *     Prints all transformed data on the console (see {@link printDataOut}
 *     method).
 *   </li>
 * </ol>
 *
 * To use this class, create your class "MyJsDoclet" inherited from
 * <code>JsDoclet</code>. Override as you want "to*Something*" methods and
 * possibly <code>beforeTreatment</code> and <code>printDataOut</code>.
 * In the entry point of your doclet, create an instance of your class, set its
 * options and just call {@link run} method.
 *
 * @summary Construct a JavaScript template for JSDoc 3.
 * @public
 *
 * @param {Object} [options={}] - Object which contains all options.
 *
 * @see {@link JsDoclet#userOptions}
 */
function JsDoclet (options) {

	/**
	 * @summary The input data.
	 * @desc The input data. Set by the publish main function.
	 * @type {!Object}
	 * @protected
	 */
	this.dataIn;


	/**
	 * @summary The output data.
	 * @desc The output data. An empty object by default.
	 * @type {!Object}
	 * @protected
	 */
	this.dataOut = {};


    /**
     * @typedef JsDocletOptions
     * @memberof JsDoclet
     *
     * @summary Minimal options object for JsDoclet.
     *
     * @prop {!Object} removeQuery - Filter for input data. By default,
     * undocumented element are removed.
     * @prop {boolean} treatInheritedElement - If <code>true</code>, inherited
     * elements will be treated, else not.
     * @prop {boolean} quiet - If <code>true</code>, all methods "toSomething"
     * does nothing, else print a message on the console.
     */


	/**
	 * @summary All user options.
	 * @type {!JsDoclet.JsDocletOptions}
	 * @protected
	 */
	this.userOptions = Object.assign (
        {
            removeQuery: { undocumented: true },
            treatInheritedElement: true,
            quiet: false
        },
        options
    );


	/**
	 * @summary List for inherited or ingnored elements. TODO
	 * @desc List for inherited or ingnored elements. Element are stored and
	 * removed by <code>getMember</code>.
	 * @type {List<Object>}
	 * @protected
	 *
	 * @see {@link getMember}
	 */
	this.ignoredElement = Object.create (null);
}



//##############################################################################
//	Usefull functions
//##############################################################################



/**
 * @summary Replace escaped <code>@</code> character by the character itself.
 * @desc Replace all sequence of an at charater escaped by an apos character
 * <code>''@</code> by just an at character <code>@</code>.
 *
 * If the given value is <code>null</code> or <code>undefined</code>, does
 * nothing and return <code>""</code>.
 * @public
 * @static
 *
 * @param {*} str - A string or whatever you want. If not a string, works with:
 * <code>"" + str</code>.
 *
 * @return {string} The new string.
 */
JsDoclet.replaceEscapedAtChar = function (str) {
	if (str === undefined || str === null)
		return "";
	else
		return ("" + str).replace (/'@/g, "@");
};


//==============================================================================
/**
 * @member EMAIL_REGEX
 * @memberof JsDoclet
 *
 * @summary Regular expression for email address surrounded by chevrons.
 * @desc Regular expression for email address surrounded by chevrons. The only
 * captured group is the email address without chevrons, leading and trailing
 * whitespaces.
 * @const {RegExp}
 * @public
 * @static
 *
 * @see {@link http://emailregex.com/}
 */
Object.defineProperty (JsDoclet, "EMAIL_REGEX", {
	value: /<\s*((?:(?:[^<>()\[\]\\.,;:\s@"]+(?:\.[^<>()\[\]\\.,;:\s@"]+)*)|(?:".+"))@(?:(?:\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(?:(?:[a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,})))\s*>/,
	enumerable: true
});


//==============================================================================
/**
 * @summary Gets the email address quoted by "&lt;" and "&gt;" in a string.
 * @desc Gets the email address quoted by "&lt;" and "&gt;" in a string. Return
 * the first one found. If not found, return an empty string.
 * @public
 * @static
 *
 * @param {!string} str - A string.
 *
 * @return {string} The email address.
 *
 * @example
 * "plop<d> <EM@IL.FR>"            ==> "EM@IL.FR"
 * "plop<d> < EM@IL.FR	>  plop"   ==> "EM@IL.FR"
 * "plop <EM@IL.FR> PLOP <d@g.ll>" ==> "EM@IL.FR"
 * "plop<d@g.l> <EM@IL.FR>"        ==> "EM@IL.FR"
 * Caution:
 * "plop<d@g.ll>plop <EM@IL.FR>"   ==> "d@g.ll"
 *
 * @see {@link JsDoclet.EMAIL_REGEX}
 */
JsDoclet.getEmailAddress = function (str) {
	var res = str.match (JsDoclet.EMAIL_REGEX);
	return res ? res[1] : "";
};


//==============================================================================
/**
 * @summary Debug function.
 * @desc Dump all fields which are not a function on the console of the given
 * element and restart with the prototype of the element.
 *
 * @public
 * @static
 *
 * @param {!*} element - An element.
 *
 * @return {void}
 */
JsDoclet.dump = function (element) {
	for (var i in element) {
		if (! (element[i] instanceof Function))
			console.warn ("\x1b[36;1m", i, "\x1b[0m:", element[i]);
	}
	if (element && element.__proto__)
		JsDoclet.dump (element.__proto__);
};


//==============================================================================
/**
 * @summary Gets all objects for an overrided/inherited element.
 * @desc Searchs the complementary of the given element. If no complementary are
 * found, stores the given element an returns <code>null</code>. Else the
 * returned element is the object which represent the doc block of the member.
 * An additional property <code>jsdoclet_parentDoc</code> is set to the object
 * which represent the doc block of a super class.
 * @private
 *
 * @param {Object} element - The element to get.
 *
 * @return {Object} All elements or <code>null</code>.
 */
JsDoclet.prototype.getMember = function (element) {
    var res, otherElement = null;

    // @inheritdoc & @override
	if (element.inheritdoc != undefined || element.override) {
        // get
        otherElement = this.ignoredElement[element.longname];
        if (otherElement) {
            // merge
            element.jsdoclet_parentDoc = otherElement;
            // console.error ("find an other " + element.longname + " : its parent (@inheritdoc/@override)");
            res = element;
        }
        else {
            // store
            this.ignoredElement[element.longname] = element;
            // console.error ("no more element for " + element.longname + " : store it (@inheritdoc/@override)");
            return null;
        }
    }
    else if (element.ignore) {
        // console.error ("@ignore " + element.longname);
        return null;
    }

    // inherited
    if (element.inherited) {
        if (element.overrides != undefined) {
            // get
            otherElement = this.ignoredElement[element.longname];
            if (otherElement) {
                // merge
                otherElement.jsdoclet_parentDoc = element;
                res = otherElement;
                // console.error ("inherited element " + element.longname + " for a sub-class");
            }
            else {
                // store
                this.ignoredElement[element.longname] = element;
                // console.error ("no more element for " + element.longname + " : store it (inherited)");
            }
        }
        else if (this.userOptions.treatInheritedElement) {
            res = element;
            // console.error ("inherited element to treat " + element.longname);
        }
    }
    else {
        // no inheritance -> its a member define for the first time
        res = element;
        // console.error ("NO treatment");
    }

    // JsDoclet.dump (res);
    // if (res == null)
    //     JsDoclet.dump (element);
    // console.error ("==========================================");
    return res;
};


//==============================================================================
/**
 * @summary Tests if a property exist in an object.
 * @desc Tests if a property exist in an object (directly or in its prototype
 * chain). Throw an error if the given object is <code>null</code> or
 * <code>undefined</code> or if the property name is not a string or an empty
 * string.
 * @static
 *
 * @param {any} obj - An object.
 * @param {string} propertyName - Name of the requested property.
 *
 * @return {boolean} <code>true</code> if the object has the requested property
 * (with or without value), <code>false</code> otherwise.
 * @throws {TypeError} If the given object is <code>null</code> or
 * <code>undefined</code>.
 * @throws {TypeError} If the property name is not a string or an empty string.
 *
 * @see {@link Object.getOwnPropertyDescriptor}
 * @see {@link Object.getPrototypeOf}
 * @see {@link Object.create}
 *
 * @example
 * var o1 = {
 *     aaa: "AAA",
 *     zero: 0,
 *     notANumber: NaN,
 *     emptyString: "",
 *     nil: null,
 *     undef: undefined
 * };
 * var o2 = Object.create (o1);
 * o2.bbb = "BBB";
 * var o3 = Object.create (null);
 * o3.ccc = "CCC";
 *
 * // returns true
 * JsDoclet.hasProperty (o1, "aaa");
 * JsDoclet.hasProperty (o1, "constructor");
 * JsDoclet.hasProperty (o1, "zero");
 * JsDoclet.hasProperty (o1, "notANumber");
 * JsDoclet.hasProperty (o1, "emptyString");
 * JsDoclet.hasProperty (o1, "nil");
 * JsDoclet.hasProperty (o1, "undef");
 *
 * JsDoclet.hasProperty (o2, "aaa");
 * JsDoclet.hasProperty (o2, "bbb");
 * JsDoclet.hasProperty (o2, "constructor");
 * JsDoclet.hasProperty (o2, "zero");
 * JsDoclet.hasProperty (o2, "notANumber");
 * JsDoclet.hasProperty (o2, "emptyString");
 * JsDoclet.hasProperty (o2, "nil");
 * JsDoclet.hasProperty (o2, "undef");
 *
 * JsDoclet.hasProperty (o3, "ccc");
 *
 * // returns false
 * JsDoclet.hasProperty (o1, "unexistingProperty");
 * JsDoclet.hasProperty (o2, "unexistingProperty");
 * JsDoclet.hasProperty (o3, "unexistingProperty");
 * JsDoclet.hasProperty (o3, "constructor");
 */
JsDoclet.hasProperty = function (obj, propertyName) {
    if (obj == null || obj == undefined)
        throw new TypeError (obj + " can't have any property");

    if (typeof propertyName != "string" || propertyName.length == 0)
        throw new TypeError ("the property name is not a string");

    var found;
    do {
        found = (Object.getOwnPropertyDescriptor (obj, propertyName) !== undefined);
        obj = Object.getPrototypeOf (obj);
    } while (!found && obj != null);

    return found;
};



//##############################################################################
//	Handlers
//##############################################################################



/**
 * @summary Handler for files.
 * @protected
 *
 * @param {!Object} aFile - A file.
 *
 * @return {any} What do you want (here <code>undefined</code>).
 */
JsDoclet.prototype.toFile = function (aFile) {
	if (!this.userOptions.quiet)
		console.log ("JsDoclet.toFile:", aFile.longname || aFile.name);
};


//==============================================================================
/**
 * @summary Handler for packages.
 * @protected
 *
 * @param {!Object} aPackage - A package.
 *
 * @return {any} What do you want (here <code>undefined</code>).
 */
JsDoclet.prototype.toPackage = function (aPackage) {
	if (!this.userOptions.quiet)
		console.log ("JsDoclet.toPackage:", aPackage.longname || aPackage.name);
};


//==============================================================================
/**
 * @summary Handler for namespaces.
 * @protected
 *
 * @param {!Object} aNamespace - A namespace.
 *
 * @return {any} What do you want (here <code>undefined</code>).
 */
JsDoclet.prototype.toNamespace = function (aNamespace) {
	if (!this.userOptions.quiet) {
		console.log ("JsDoclet.toNamespace:",
			aNamespace.longname || aNamespace.name);
	}
};


//==============================================================================
/**
 * @summary Handler for type definition.
 * @protected
 *
 * @param {!Object} aTypeDef - A type definition.
 *
 * @return {any} What do you want (here <code>undefined</code>).
 */
JsDoclet.prototype.toTypedef = function (aTypeDef) {
	if (!this.userOptions.quiet)
		console.log ("JsDoclet.toTypedef:", aTypeDef.longname || aTypeDef.name);
};


//==============================================================================
/**
 * @summary Handler for callback definition (typedef on function).
 * @protected
 *
 * @param {!Object} aCallback - A callback definition.
 *
 * @return {any} What do you want (here <code>undefined</code>).
 */
JsDoclet.prototype.toCallback = function (aCallback) {
	if (!this.userOptions.quiet) {
		console.log ("JsDoclet.toCallback:",
            aCallback.longname || aCallback.name);
	}
};


//==============================================================================
/**
 * @summary Handler for classes.
 * @protected
 *
 * @param {!Object} aClass - A class.
 *
 * @return {any} What do you want (here <code>undefined</code>).
 */
JsDoclet.prototype.toClass = function (aClass) {
	if (!this.userOptions.quiet)
		console.log ("JsDoclet.toClass:", aClass.longname || aClass.name);
};


//==============================================================================
/**
 * @summary Handler for classes' constructors.
 * @protected
 *
 * @param {!Object} aClass - A constructor.
 *
 * @return {any} What do you want (here <code>undefined</code>).
 */
JsDoclet.prototype.toConstructor = function (aConstructor) {
	if (!this.userOptions.quiet) {
		console.log ("JsDoclet.toConstructor:",
			aConstructor.longname || aConstructor.name);
	}
};


//==============================================================================
/**
 * @summary Handler for interfaces.
 * @protected
 *
 * @param {!Object} anInterface - An interface.
 *
 * @return {any} What do you want (here <code>undefined</code>).
 */
JsDoclet.prototype.toInterface = function (anInterface) {
	if (!this.userOptions.quiet) {
		console.log ("JsDoclet.toInterface:",
			anInterface.longname || anInterface.name);
	}
};


//==============================================================================
/**
 * @summary Handler for enumerations.
 * @protected
 *
 * @param {!Object} anEnumeration - An enumeration.
 *
 * @return {any} What do you want (here <code>undefined</code>).
 */
JsDoclet.prototype.toEnum = function (anEnumeration) {
	if (!this.userOptions.quiet) {
		console.log ("JsDoclet.toEnum:",
			anEnumeration.longname || anEnumeration.name);
	}
};


//==============================================================================
/**
 * @summary Handler for enumeration constant.
 * @protected
 *
 * @param {!Object} anEnumConstant - An enumeration constant.
 *
 * @return {any} What do you want (here <code>undefined</code>).
 */
JsDoclet.prototype.toEnumConstant = function (anEnumConstant) {
	if (!this.userOptions.quiet) {
		console.log ("JsDoclet.toEnumConstant:",
			anEnumConstant.longname || anEnumConstant.name);
	}
};


//==============================================================================
/**
 * @summary Handler for variables.
 * @protected
 *
 * @param {!Object} aVariable - A variable.
 *
 * @return {any} What do you want (here <code>undefined</code>).
 */
JsDoclet.prototype.toVariable = function (aVariable) {
	if (!this.userOptions.quiet) {
		console.log ("JsDoclet.toVariable:",
            aVariable.longname || aVariable.name);
	}
};


//==============================================================================
/**
 * @summary Handler for attributes.
 * @protected
 *
 * @param {!Object} anAttribute - An attribute.
 *
 * @return {any} What do you want (here <code>undefined</code>).
 */
JsDoclet.prototype.toAttribute = function (anAttribute) {
	if (!this.userOptions.quiet) {
		console.log ("JsDoclet.toAttribute:",
			anAttribute.longname || anAttribute.name);
	}
};


//==============================================================================
/**
 * @summary Handler for functions.
 * @protected
 *
 * @param {!Object} aFunction - A function.
 *
 * @return {any} What do you want (here <code>undefined</code>).
 */
JsDoclet.prototype.toFunction = function (aFunction) {
	if (!this.userOptions.quiet) {
		console.log ("JsDoclet.toFunction:",
            aFunction.longname || aFunction.name);
	}
};


//==============================================================================
/**
 * @summary Handler for methods.
 * @protected
 *
 * @param {!Object} aMethod - A method.
 *
 * @return {any} What do you want (here <code>undefined</code>).
 */
JsDoclet.prototype.toMethod = function (aMethod) {
	if (!this.userOptions.quiet)
		console.log ("JsDoclet.toMethod:", aMethod.longname || aMethod.name);
};


//==============================================================================
/**
 * @summary Handler for mixins.
 * @protected
 *
 * @param {!Object} aMixin - A mixin.
 *
 * @return {any} What do you want (here <code>undefined</code>).
 */
JsDoclet.prototype.toMixin = function (aMixin) {
	if (!this.userOptions.quiet)
		console.log ("JsDoclet.toMixin:", aMixin.longname || aMixin.name);
};


//==============================================================================
/**
 * @summary Handler for events.
 * @protected
 *
 * @param {!Object} anEvent - An event.
 *
 * @return {any} What do you want (here <code>undefined</code>).
 */
JsDoclet.prototype.toEvent = function (anEvent) {
	if (!this.userOptions.quiet)
        console.log ("JsDoclet.toEvent:", anEvent.longname || anEvent.name);
};


//==============================================================================
/**
 * @summary Handler for unknown element.
 * @protected
 *
 * @param {!Object} element - An unknown element.
 *
 * @return {any} What do you want (here <code>undefined</code>).
 */
JsDoclet.prototype.toUnknowElement = function (element) {
	if (!this.userOptions.quiet) {
		console.log ("JsDoclet.toUnknowElement:", element.kind,
			":", element.longname || element.name);
	}
};



//##############################################################################
//	Treatment methods
//##############################################################################


/**
 * @summary Procceeds pre-treatments on elements given by JSDoc 3.
 * @desc Procceeds pre-treatments on elements given by JSDoc 3. Just removes
 * some elements with TaffyDB query <code>this.userOptions.removeQuery</code>.
 * @protected
 *
 * @param {TAFFY} data - A TaffyDB collection representing all the symbols
 * documented in your code.
 *
 * @return {Object} An array of all JSDoc 3 objects to treat.
 *
 * @see {@link http://taffydb.com/writing_queries.html}
 */
JsDoclet.prototype.beforeTreatment = function (data) {
    data (this.userOptions.removeQuery).remove ();
    return data ().get ();
};


//==============================================================================
/**
 * @summary Filters and extract elements.
 * @desc Filters elements of the parent node (for first time, don't filter
 * anything) and call the appropriate <code>to*Something*</code> method on them
 * to extracts information. Grafts the result of <code>to*Something*</code>
 * method on the parent node.
 *
 * For namespaces, classes, interfaces and mixins, this method is recursively
 * called with the current element (return by <code>to*Something*</code>
 * method), the list of all child nodes, the long name and the kind of the
 * current element. Kinds are:
 * <ul>
 *   <li>for namespaces: "namespace"</li>
 *   <li>for classes and interfaces: "classifier"</li>
 *   <li>for mixins: "mixin"</li>
 * </ul>
 * @private
 *
 * @param {Object} parentNode - The parent node where to put all extracted
 * element.
 * @param {Object} allNodes - List of all nodes. Filtred before traitment.
 * @param {string} [parentLongname] - Identifier of the parent node. Use to
 * extract from child nodes only member of the parent node.
 * @param {string} [parentKind=""] - Kind of the parent. Mostely, its the
 * <code>kind</code> attribute of the parent, but for classes an interfaces it's
 * <code>"classifier"</code>.
 *
 * @return {void}
 */
JsDoclet.prototype.graft = function (parentNode, allNodes, parentLongname,
	parentKind)
{
    var elements = allNodes.filter (function (element) {
        return (element.memberof === parentLongname);
    });

	var element, xmlElem, len = elements.length;
    for (var i = 0; i < len; ++i) {
		element = elements[i];
        // if (element.name == "instanceProperty") {
        //     JsDoclet.dump (element);
        //     console.error ("==============================================");
        // }

		/// File
		if (element.kind === "file") {
			this.graftChild (parentNode, this.toFile (element), "file");
		}

		/// Package
		else if (element.kind === "package") {
			this.graftChild (parentNode, this.toPackage (element), "package");
		}

		/// Namespace
        else if (element.kind === "namespace") {
            xmlElem = this.toNamespace (element);
            this.graftChild (parentNode, xmlElem, "namespace");
            this.graft (
                xmlElem instanceof Object ? xmlElem : parentNode,
                allNodes,
                element.longname,
                "namespace"
            );
        }

		/// Callback
		else if (element.kind === "typedef" && element.type
			&& element.type.names[0] === "function")
		{
			this.graftChild (parentNode, this.toCallback (element), "callback");
		}

		/// Typedef
		else if (element.kind === "typedef") {
			this.graftChild (parentNode, this.toTypedef (element), "typedef");
		}

		/// Class
		else if (element.kind === "class") {
            xmlElem = this.toClass (element);
            this.graftChild (parentNode, xmlElem, "class");
            this.graft (
                xmlElem instanceof Object ? xmlElem : parentNode,
                allNodes,
                element.longname,
                "classifier"
            );
		}

		/// Interface
		else if (element.kind === "interface") {
            xmlElem = this.toInterface (element);
            this.graftChild (parentNode, xmlElem, "interface");
            this.graft (
                xmlElem instanceof Object ? xmlElem : parentNode,
                allNodes,
                element.longname,
                "classifier"
            );
		}

		/// Enumeration
		else if (element.kind === "member" && element.isEnum) {
            xmlElem = this.toEnum (element);
            this.graftChild (parentNode, xmlElem, "enumeration");
            if (xmlElem !== undefined && element.properties) {
				for (var j = 0; j < element.properties.length; ++j) {
                    this.graftChild (
                        xmlElem,
                        this.toEnumConstant (element.properties[j]),
                        "enumValue");
				} // end FOR
            } // end IF xmlElem is defined and there are enumeration values
		}

        /// Constructor
		else if (parentKind === "classifier" && element.name === "constructor")
		{
            this.graftChild (parentNode, this.toConstructor (element),
                "constructors");
		}

		/// Attribute
		else if ((element.kind === "member" || element.kind === "constant")
			&& parentKind === "classifier")
		{
			element = this.getMember (element);
			if (!element)
				// No element are returned, so it's the first one
                // -> does nothing, wait for the complementary
				continue;
			this.graftChild (parentNode, this.toAttribute (element),
                "attributes");
		}

		/// Variable
		else if (element.kind === "member" || element.kind === "constant") {
            this.graftChild (parentNode, this.toVariable (element),
                "properties");
        }

		/// Method
		else if (element.kind === "function"
			&& parentKind === "classifier")
		{
            element = this.getMember (element);
			if (!element)
				// No element are returned, so it's the first one
                // -> does nothing, wait for the complementary
				continue;
            this.graftChild (parentNode, this.toMethod (element), "methods");
		}

		/// Function
		else if (element.kind === "function") {
            this.graftChild (parentNode, this.toFunction (element), "function");
        }

		/// Mixin
		else if (element.kind === "mixin") {
            xmlElem = this.toMixin (element);
            this.graftChild (parentNode, xmlElem, "mixin");
            this.graft (
                xmlElem instanceof Object ? xmlElem : parentNode,
                allNodes,
                element.longname,
                "mixin"
            );
        }

		/// Event
        else if (element.kind === "event") {
            this.graftChild (parentNode, this.toEvent (element), "event");
        }

		/// Unknow
		else {
            this.graftChild (parentNode, this.toUnknowElement (element));
        }
    }
};


//==============================================================================
/**
 * @summary Grafts a child to its parent.
 * @desc Grafts a child to its parent if the child is not
 * <code>undefined</code>. Adds the child to the array
 * <code>parent[linkPropertyName]</code>. If this array does not exist, it is
 * created before.
 *
 * If the child has a property called "jsdoclet_linkPropertyName", the value of
 * this property replace the argument <code>linkPropertyName</code>.
 * @protected
 *
 * @param {!Object} parent - The parent object.
 * @param {!any} child - The child object.
 * @param {string} [linkPropertyName] - Name of the link property in the parent.
 * Must be provied if the child don't have any property called
 * "jsdoclet_linkPropertyName".
 *
 * @return {void}
 * @throws {TypeError} If the link property name used is not a string or is an
 * empty string.
 */
JsDoclet.prototype.graftChild = function (parent, child, linkPropertyName) {
    if (child !== undefined) {
        /// checks for alias
        if (JsDoclet.hasProperty (child, "jsdoclet_linkPropertyName"))
            linkPropertyName = child.jsdoclet_linkPropertyName;

        /// Checks for linkPropertyName
        if (typeof linkPropertyName != "string"
            || linkPropertyName.length == 0)
        {
            throw new TypeError (
                "the link property name must be a non-empty string");
        }

        /// checks for parent property existence
        if (! JsDoclet.hasProperty (parent, linkPropertyName))
            parent[linkPropertyName] = [];

        /// grafts
        parent[linkPropertyName].push (child);
    }
};


//==============================================================================
/**
 * @summary Print data after proccessing.
 * @desc Print data after proccessing. Just print "dataOut" attribute on the
 * console.
 * @protected
 *
 * @return {void}
 */
JsDoclet.prototype.printDataOut = function () {
	console.log (this.dataOut);
};



//##############################################################################
//	Main
//##############################################################################



/**
 * @summary Runs the doclet.
 * @desc Runs these three steps:
 * <ol>
 *   <li>filters data;</li>
 *   <li>transforms data;</li>
 *   <li>prints result.</li>
 * </ol>
 * Do not override this method, unless you know exactly what you do.
 * @public
 *
 * @param {TAFFY} data - A TaffyDB collection representing all the symbols
 * documented in your code.
 *
 * @return {void}
 *
 * @see {@link JsDoclet.beforeTreatment}
 * @see {@link JsDoclet.printDataOut}
 * @see {@link http://taffydb.com/}
 */
JsDoclet.prototype.run = function (data) {
	/// filter and get data
    this.dataIn = this.beforeTreatment (data);

	/// transform
    this.graft (this.dataOut, this.dataIn);

	/// print
	this.printDataOut ();
};



//##############################################################################
//	Export
//##############################################################################



module.exports = JsDoclet;
