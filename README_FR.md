# JsDoclet : template pour JSDoc 3

<i>(document also available in [english :gb:](README.md))</i>



## Présentation

<!-- logo JsDoclet -->
<div style="width: 8ex; height: 8ex; transform: rotate(-45deg); float: left; margin: 1ex 2ex 1ex 1ex"><div style="background-color: #048; width: 100%; height: 50%; border-radius: 4ex 4ex 0 0"></div><div style="background-color: #EEE; width: 100%; height: 50%; border-radius: 0 0 4ex 4ex"></div></div>

_JsDoclet_ est une base de template pour [JSDoc 3][jsdoc].
Il offre un filtrage et une mécanique de
traitement des éléments puis un affichage final des résultats.

Ce template dépends de la bibliothèque [TaffyDB][taffydb].

<!-- TODO
- possibilité de surcharge
- possibilité de surcharge des constructeurs
- catégories
- ne prend pas en compte les tags de compile closure
-->



## Sommaire

* [Installation](#Installation)
* [Usage](#Usage)
	* [Exemple de point d'entré](#Exemple-de-point-dentré)
* [Liste des balises et de leurs support](#Liste-des-balises-et-de-leurs-support)
* [Fonctionnement](#Fonctionnement)
* [Liens utiles](#Liens-utiles)



## Installation

Section en cours d'écriture. <!-- TODO -->



## Usage

1. Créez votre propre classe héritant de `JsDoclet`.
2. Surchargez les méthodes `to*Something*` souhaité pour effectuer les traitements
   désiré sur les différentes entités.
3. Surchargez les méthodes `beforeTreatment` et `printDataOut` si besoin.
4. Créez un point d'entré dans lequel vous créez une instance de votre template,
   paramétrez vos options, puis appelez la méthode `run` sur celui-ci.
5. Admirez le résultat et congratulez-vous :)



### Exemple de point d'entré

```javascript
exports.publish = function (data, opts) {
	// créez votre template avec vos options
	var template = new MyJsDoclet (opts);

	// lancez le template
	template.run (data);
	// Cette méthode :
	// 1) appelle "beforeTreatment" avec "data"
	// 2) appelle les méthodes "to*Something*" pour chaque élément à traiter
	// 3) appelle "printDataOut" pour exporter les résultats
};
```



## Liste des balises et de leurs support

_JsDoclet_ ne supporte pas toutes les balises jsdoc. Consultez
le tableau suivant pour connaître le degré de support de chacune d'elles.

Total | Partiel | À venir /<br>comportement inconnu
--- | --- | ---
\@callback<br>\@class, \@constructor<br>\@file, \@overview, \@fileoverview<br>\@enum<br>\@event<br>\@func, \@function, \@method<br>\@ignore<br>\@inheritdoc<br>\@interface<br>\@member, \@var<br>\@namespace<br>\@override | \@mixin | \@constructs<br>\@exports<br>\@external<br>\@generator<br>\@hideconstructor<br>\@mixes<br>\@module<br>\@prop, \@property<br>\@readonly<br>\@requires<br>\@this<br>\@todo<br>\@tutorial<br>\@variation<br>\@yields, \@yield

Aucune balise exclusive à [Closure Compiler](https://github.com/google/closure-compiler/wiki/Annotating-JavaScript-for-the-Closure-Compiler) ne sont supporté.



## Fonctionnement

De façon général, _JsDoclet_ fonctionne de la manière suivante :

1) Pré-traitement des éléments reçu de JSDoc 3;
2) Parcours des éléments restant :
	- à chacun est appelé une méthode `to*Something*` correspondante;
	- puis l'élément transformé est rattaché à son parent;
3) Post-traitement et export des éléments transformé.

Toutes ces étapes sont réalisé lors de l'appel à la méthode `run`.

Par défaut :

- Le pré-traitement élimine certains éléments via une requête [TaffyDB][taffydb]
  décrite dans `userOptions.removeQuery`;
- Chacune des méthodes `to*Something*` affiche son nom ainsi que le nom de
  l'élément reçu. Le nom d'un élément est en priorité la valeur de son attribut
  `longname` ou sinon celui de son attribut `name`;
- Il n'y a pas de post-traitement, seulement un affichage des éléments
  transformé sur la sortie standard via `console.log`.

Pour plus d'explications, vous pouvez consulter le fichier [HOWTO.md][howtofr].



## Liens utiles


* :gb: This file in [english](README.md)
* JSDoc 3 : [documentation](http://usejsdoc.org/) et dépôt [git][jsdoc]
* Site officiel de [TaffyDB][taffydb]
* Documentation de [JsDoclet](doc/index.html)
* Explications approfondis du fonctionnement de ce template : fichier [HOWTO.md][howtofr]
* [Haruki][haruki], le template dont est inspiré _JsDoclet_



<!--### LINKS ###############################################################-->

[jsdoc]:https://github.com/jsdoc3/jsdoc "Dépôt git officiel de JSDoc 3"
[taffydb]:http://taffydb.com/ "Site officiel de TaffyDB"
[haruki]: https://github.com/jsdoc3/jsdoc/tree/master/templates/haruki ""
[howtofr]:HOWTO_FR.md "Consulter le fichier de fonctionnement de JsDoclet"
