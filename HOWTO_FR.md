# JsDoclet : Comment ça marche ?

<!-- TODO
tester cas de constructeurs
expliquer surcharge
fix propre surcharge
-->


_JsDoclet_ filtre de dissocie les éléments issue de votre code JavaScript
en plusieurs catégorie pour ensuite effectué des transformations sur chacun de
ses éléments. Ces catégories peuvent être :

- des types : classes, interfaces, énumération, typedef, callback, événement;
- des propriétés : variable, attribut, valeur d'énumération;
- des opérations : fonction, méthode, constructeur;
- des conteneurs : paquet ou espace de nom;
- ou d'autres : mixin, fichier, etc.



## Sommaire

- [Fonctionnement général](#Fonctionnement-général)
    - [Diagramme de classe](#Diagramme-de-classe)
- [Options](#Options)
- [Pré-traitement](#Pré-traitement)
- [Transformation et rattachement](#Transformation-et-rattachement)
    - [Tri des éléments](#Tri-des-éléments)
	- [Qui traite quoi ?](#Qui-traite-quoi-)
    - [Liens de parenté des éléments](#Liens-de-parenté-des-éléments)
    	- [Cas particulier : traitement des enfants mais pas de leurs parents](#Cas-particulier--traitement-des-enfants-mais-pas-de-leurs-parents)
- [Post-traitement et affichage](#Post-traitement-et-affichage)
- [Exemple](#Exemple)



## Fonctionnement général

Pour utiliser un template conçu à partir de _JsDoclet_, il suffit de créer
une instance de template puis d'appeler la méthode `run` avec en paramètre
les données reçu de JSDoc 3.
Cette méthode fonctionne de la manière suivante :

1) Filtrage des éléments reçu via la méthode `beforeTreatment`;
2) Parcours des éléments restant via la méthode `graft`:
	- à chaque éléments est appelé la méthode de transformation correspondante;
	- puis l'élément transformé est rattaché à son parent;
3) Affichage ou export des éléments transformé via la méthode `printDataOut`.

Les méthode `beforeTreatment` et `printDataOut` ainsi que les méthodes
`toFile`, `toPackage`, `toNamespace`, `toCallback`,
`toTypedef`, `toClass`, `toInterface`, `toEnum`, `toAttribute`, `toVariable`,
`toEnumConstant`, `toConstructor`, `toMethod`, `toFunction`, `toMixin`, `toEvent`
et `toUnknowElement` (appelé dans le reste du document les méthodes `to*Something*`)
peuvent être redéfini à votre guise.

Inversement, les méthodes `graft`, `graftChild`, `getMember` et `run` **ne**
devraient **pas** être redéfinit. Si vous pensez que cela est nécessaire, relisez
d'abord ce document pour tenter de trouver une réponse plus adéquat à votre problème.
Si votre détermination ne fléchit pas, souvenez-vous qu'_un grand pouvoir implique
de grandes responsabilités_.



### Diagramme de classe

[![Diagramme de classe de JsDoclet][jsdoclet_uml]][jsdoclet_uml]

[jsdoclet_uml]:JsDoclet_UML_class.png "Cliquez pour voir l'image en taille réel"


Pour plus de détails, consultez la [documentation](doc/index.html "Consultez la documentation de JsDoclet").



## Options

_JsDoclet_ regroupe toutes ces différentes options dans un seule et unique
attribut : `userOptions`. Cet attribut contient les propriétés suivante :

- `removeQuery` : Argument de requête TaffyDB pour écarter les éléments à ne pas traiter (voir [Pré-traitement](#Pré-traitement) pour plus de détails).
- `treatInheritedElement` : Booléen indiquant si l'on traite les éléments hérités. `false` par défaut.
- `quiet` : Par défaut, chaque méthodes `to*Something*` affiche son nom et le nom de l'élément reçu dans la console. Si cette option vaut `true`, les méthodes deviennent silencieuses.

Vous pouvez donner vos propre valeurs pour chacune de ces options en passant
en paramètre au constructeur de `JsDoclet`, un objet contenant ces trois propriétés.
Vous pouvez également y ajouter des propriétés supplémentaires qui seront
ajouté à l'attribut `userOptions`.



## Pré-traitement

JSDoc 3 fourmis les informations pour chaque élément grâce à la bibliothèque
[TaffyDB][taffydb]. Ces informations sont empaquetées dans une fonction
représentant un base de donnée. Il est possible d'appeler cette fonction
pour effectuer des requêtes sur cette base (pour plus d'informations,
consultez la documentation officielle à propos des
[requêtes de TaffyDB](http://taffydb.com/writing_queries.html "Comment écrire des requêtes avec TaffyDB")).

_JsDoclet_ effectue un pré-traitement sur les données reçu grâce à la méthode
`beforeTreatment`. Cette méthode reçoit en paramètre la base de données des éléments
et retourne un tableau contenant tous les éléments à traiter. Par défaut, une requête
est effectué pour supprimer un certains nombres d'éléments. Le code de cette méthode
est le suivant :
```javascript
JsDoclet.prototype.beforeTreatment = function (data) {
    data (this.userOptions.removeQuery).remove ();
    return data ().get ();
};
```  
La propriété `userOptions.removeQuery` vaut par défaut `{ undocumented: true }`.
Ainsi, tous les éléments non documenté ne seront pas traité.

Redéfinissez cette méthode pour effectuer vos propre traitement, ou donnez simplement
votre requête si vous ne souhaitez que supprimer certains éléments.
_**Attention**_ : Supprimer trop éléments peut mener à des comportement indésirable.
Pour plus de détails, voir
[le mécanisme de transformation et de rattachement](#Transformation-et-rattachement) et
[un cas particulier : traitement des enfants mais pas de leurs parents](#Cas-particulier-:-traitement-des-enfants-mais-pas-de-leurs-parents).



## Transformation et rattachement

Chaque élément à transformer est envoyé à la méthode `to*Something*` correspondante
à sa catégorie,
puis le retour de cette méthode est rattaché au parent de l'élément.
Ce mécanisme est effectué par la méthode `JsDoclet.graft`
qui procède de manière récursive. À chaque appel,
elle tri tous les éléments pour ne considérer que les fils du parent courant.

Les appels récursif se font lorsqu'un élément pouvant être un conteneur est rencontré
(à savoir : les espaces de nom, les classes, les interfaces et les mixin).
L'élément devient alors le nouveau parent et ne sont considérés que ses éléments fils.
_**N.B.**_ : le rattachement s'effectue sur l'objet issu de la transformation
et non du parent lui même.

Au premier appel de la méthode `JsDoclet.graft`, ne sont considéré que les éléments
n'ayant pas de valeur pour la propriété `memberof` (i.e. `element.memberof === undefined`).
Tous les éléments traité sont alors rattaché à l'attribut `JsDoclet.dataOut`.



### Tri des éléments

À chaque appel, les éléments considéré sont ceux dont
la propriété `memberof` à la même valeur que la propriété `longname` du parent.
Ainsi, pour deux éléments `element1` et `element2`, `element2` est l'un des fils de `element1`
si et seulement si la condition `element2.memberof === element1.longname` est vrai.



### Qui traite quoi ?

Le tableau suivant présentes quelle méthode `to*Something*` traite quelle
catégorie d'élément.


<span id="toSomethingList"></span><!-- just an anchor -->

Méthode | Éléments traités | Condition[<sup>1</sup>](#conditionNote "Voir la note sur les conditions") | Balise
--- | --- | --- | ---
toFile | Les fichiers | `element.kind === "file"`  | \@file<br>\@overview<br>\@fileoverview
toPackage | Les paquet ??? | `element.kind === "package"` | aucune ???
toNamespace | Les espaces de nom | `element.kind === "namespace"` | \@namespace
toCallback | Les définitions de types de fonction | `element.kind === "typedef"` et `element.type.names[0] === "function"` | \@callback
toTypedef | Les définitions de types qui NE sont PAS de types de fonction | `element.kind === "typedef"` | \@typedef
toClass | Les classes | `element.kind === "class"` | \@class<br>\@constructor
toInterface | Les interfaces | `element.kind === "interface"` | \@interface
toEnum | Les énumérations | `element.kind === "member"` et `element.isEnum` | \@enum
toConstructor | Les constructeur d'une classe | `element.name === "constructor"` et le parent est une classe ou une interface | \@class<br>\@constructor
toAttribute | Les propriétés qui peuvent être considérés comme des attributs d'une classe ou d'une interface | `element.kind` vaut `"member"` ou `"constant"` et le parent est une classe ou une interface | \@member<br>\@var<br>\@const
toVariable | Les propriétés qui NE peuvent PAS être considérés comme des attributs d'une classe ou d'une interface | `element.kind` vaut `"member"` ou `"constant"` | \@member<br>\@var<br>\@const
toEnumConstant | Les valeurs d'une énumération | aucune<sup>[2](#enumConstantNote "Voir note sur les valeurs d'une énumération")</sup> | code JavaScript ou<br>\@property<br>\@prop
toMethod | Les fonctions qui peuvent être considérés comme des méthodes d'une classe ou d'une interface | `element.kind === "function"` et `parentKind === "classifier"` | \@function<br>\@func<br>\@method
toFunction | Les fonctions qui NE peuvent PAS être considérés comme des méthodes d'une classe ou d'une interface | `element.kind === "function"` | \@function<br>\@func<br>\@method
toMixin | Les mixin ??? | `element.kind === "mixin"`  | \@mixin
toEvent | Les définitions d'événement | `element.kind === "event"`  | \@event
toUnknowElement | Tous les éléments qui ne rentre pas dans les catégories précédentes  | Toutes les conditions précédentes sont fausses | valeur personnalisé pour \@kind


<sup id="conditionNote">1</sup> : L'algorithme de _JsDoclet_ définit la nature des éléments dans le même ordre que le tableau. Ainsi, les conditions seules sont nécessaire mais pas suffisante pour dissocier les éléments. Prisent dans l'ordre présenté, elles deviennent suffisantes. [<sup>&#x2191;</sup>](#toSomethingList "Retournez en haut du tableau")

<sup id="enumConstantNote">2</sup> : Les valeurs d'une énumération sont directement stockés dans un tableau rattaché à l'élément représentant l'énumération au travers de l'attribut `properties`. Chaque valeurs est donc directement envoyées à `toEnumConstant` dès qu'un élément est repéré comme étant une énumération. [<sup>&#x2191;</sup>](#toSomethingList "Retournez en haut du tableau")



### Liens de parenté des éléments

Chaque élément fils est rattaché à son parent via l'attribut par défaut de chaque type d'élément
ou via un attribut personnalisé. Pour choisir cet attribut,
il suffit de définir la propriété `jsdoclet_linkPropertyName` dans l'élément fils
et de lui donner comme valeur une chaîne de caractère représentant le nom de l'attribut
auquel il doit être rattaché dans le parent.

Cet attribut est un tableau non vide d'éléments fils. Lors du rattachement,
si l'attribut n'existe pas, il sera d'abord défini comme étant un tableau vide,
puis l'élément y sera ajouté. Si il existe déjà, l'élément est ajouté via la méthode
`push`.

Il est également possible de ne pas effectué de rattachement. Si une méthode
`to*Something*` retourne la valeur `undefined`, cette valeur ne sera pas rattaché
au parent. Si tout autre valeurs est retourné, le rattachement aura lieu.

Le tableau suivant indique pour chaque type d'élément, l'attribut par défaut
auquel il est rattaché dans le parent.

<span id="relationshipTable"></span><!-- Just an anchor -->

Élement                        | Attribut de rattachement
------------------------------ | ------------------------
Fichier                        | `file`
Paquet                         | `package`
Espace de nom                  | `namespace`
Définition de type de fonction | `callback`
Définition de type             | `typedef`
Classe                         | `class`
Interface                      | `interface`
Énumération                    | `enumeration`
Constructeur                   | `constructors`
Attribut                       | `attributes`
Variable                       | `properties`
Valeur d'énumération           | `enumValue`
Méthode                        | `methods`
Fonction                       | `function`
Mixin                          | `mixin`
Événement                      | `event`
Element inconnu                | aucun<sup>[3](#unknowElementNote "Voir note sur la parenté pour les éléments inconnu")</sup>


Les éléments n'ayant pas de parent (leurs propriété `scope` vaut `"global"`)
sont rattaché directement à `JsDoclet.dataOut`.

<sup id="unknowElementNote">3</sup> : Pour les éléments inconnu, il est nécessaires de définir la propriété `jsdoclet_linkPropertyName` puisque qu'aucun attribut par défaut n'est défini. [<sup>&#x2191;</sup>](#relationshipTable "Retournez en haut du tableau")



#### Cas particulier : traitement des enfants mais pas de leurs parents

Lors du rattachement d'un élément, si le traitement de son parent n'a retourné
aucun objet, ce rattachement s'effectue sur le grand-parent, sinon l'arrière
grand-parent, etc. Ainsi, tout élément traité sera nécessairement accessible
depuis l'une des propriétés ou des sous-propriétés de l'attribut `JsDoclet.dataOut`.

_**Attention**_ : Si vous souhaitez traiter des éléments sans traiter leurs parents,
vous ne devez pas écarter ses derniers lors de la phase de pré-traitement
(voir l'[exemple](#Exemple) plus bas).



## Post-traitement et affichage

_JsDoclet_ ne procède à aucun post-traitement par défaut. Si un post-traitement
vous est nécessaire, redéfinissez la méthode `printDataOut` pour y effectuer vos
actions puis exportez les données de la manière de votre choix.

La méthode `JsDoclet.printDataOut` affiche simplement les résultats,
contenu dans l'attribut `dataOut`, dans la sortie standard via `console.log`.



## Exemple

Voici un exemple de template JSDoc 3 se servant de _JsDoclet_ pour afficher
le nom de toutes les méthodes de classe mais pas les méthodes d'interface :

```javascript
var JsDoclet = require ('JsDoclet');

PrintAllMethods.prototype = Object.create (JsDoclet.prototype);
PrintAllMethods.prototype.constructor = PrintAllMethods;

function PrintAllMethods (options) {
    JsDoclet.call (this,
        Object.assign (
            {
                removeQuery: function () {
                    return this.kind !== "function" && this.kind !== "class"
                        && this.kind !== "namespace";
                },
                quiet: true
            },
            options
        )
    );
}

PrintAllMethods.prototype.toMethod = function (aMethod) {
    return {
        jsdoclet_linkPropertyName: "methodList",
        value: aMethod.name
    };
};

PrintAllMethods.prototype.printDataOut = function () {
    if (! this.dataOut.methodList)
        console.log ("Aucune méthode");
    else {
        this.dataOut.methodList.forEach (function (elem) {
            console.log (elem.value);
        });
    }
};

exports.publish = function (data, opts) {
	var doclet = new PrintAllMethods (opts);
	doclet.run (data);
};
```

Dans cet exemple, seules les méthodes de classe sont à considérer.

Les méthodes,
comme les fonction ou les constructeurs, ont `element.kind === "function"`.
Elles sont contenu dans des classes qui ont `element.kind === "class"`
qui à leurs tours peuvent être contenu dans des espaces de nom qui ont
`element.kind === "namespace"`. Le filtre de pré-traitement ne doit donc
supprimer aucun élément de ce genre.

Le traitement des méthodes ne doit retournez que leurs nom.
Ici, les méthodes seront greffée à un attribut nommé _methodList_ plutôt qu'à
l'attribut par défaut nommé _methods_. Ces deux informations doivent donc être
encapsulé dans un objet de votre choix. Les classes est les espaces de nom n'étant
pas traité, les méthodes se retrouveront directement greffée à `dataOut.methodList`.

Lors de l'affichage, un simple test permet de vérifier
qu'au moins une méthode a été ajouté et que donc l'attribut `dataOut.methodList`
existe et peut être utilisé sans levez d'exceptions.



<!--### LINKS ###############################################################-->

[jsdoc]:https://github.com/jsdoc3/jsdoc
[taffydb]:http://taffydb.com/ "Aller sur le site officiel de TaffyDB"
