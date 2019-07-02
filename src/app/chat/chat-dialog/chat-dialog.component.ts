import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { ChatService ,ArticleHuile, Estimation, EstimationAffichage, ArticleRechercher, Avis, ArticleFiltre, StockIndisponible } from '../chat.service';
import { Observable } from 'rxjs';
import { scan, startWith, map } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
// import { noUndefined } from '@angular/compiler/src/util';

@Component({
  selector: 'chat-dialog',
  templateUrl: './chat-dialog.component.html',
  styleUrls: ['./chat-dialog.component.css']
})

export class ChatDialogComponent implements OnInit, AfterViewChecked {
  container: HTMLElement;
  myControlMarques = new FormControl();
  myControlModeles = new FormControl();
  myControlCylindres = new FormControl();

  listMarques:any = [];
  listModeles:any = [];
  listCylindres:any = [];
  filtrageMarques:Observable<any[]>;
  filtrageModeles:Observable<any[]>;
  filtrageCylindres:Observable<any[]>;

  showGif:boolean;
  discussionInput:boolean;

  marqueIsOK:boolean;
  plaqueIsOK:boolean;
  mailIsOK:boolean;
  codePostalIsOK:boolean;

  statusMag:boolean;
  statusFiltre:boolean;
  statusBonPlans:boolean;

  id_ktype:string;
  id_vehiculeSpe:string;
  id_estimation:string;
  id_magasin:string;
  formulaireMessage:string;
  carImmatriculation:string;

  libelleMarque:string;
  libelleModele:string;
  libelleCylindre:string;
  marque:string;
  modele:string;
  cylindre:string;
  email:string;
  codePostal:string;

  currentRate:number;

  marques:Array<Object>;
  modeles: Array<Object>;
  cylindres:Array<Object>;
  ListHuiles:Array<ArticleHuile>;
  ListFiltres:Array<ArticleFiltre>;
  listBonPlans:any;

  messages:Observable<Object[]>;

  avis:Avis;
  estimation:Estimation;
  estimationAffichage:EstimationAffichage;
  huile:ArticleRechercher;
  filtreSelected:ArticleFiltre;

  constructor(public chat: ChatService) { }

  //Démarrage de l'application
  ngOnInit() {
    this.resetVariables()
    this.chat.converseStart("Bonjour ! Je suis Cashy votre assistant automatique. Je vais vous aider à obtenir le prix de votre vidange .")
    this.chat.first("Bonjour")
    this.messages = this.chat.conversation.asObservable().pipe(scan((acc,val) => acc.concat(val)))
  }

  //Check après vérification de la vue d'un composant pour les modifications
  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  //Composant msgContainer pour scroller automatique vers le bas
  scrollToBottom() {
    var height = document.getElementById('msgContainer').scrollHeight;
    window.scrollTo(0,height)
  }

  //Conversation avec le chatbot via le formulaire message
  sendMessage() {
    this.chat.converse(this.formulaireMessage)
    this.formulaireMessage = ""
  }

  //Clic sur les boutons des reponses FACEBOOK MESSENGERS "Quick Replies" { msg : nom du boutton, objButton : Title du Quick Replies }
  actionButton(msg:string, objButton:any) {
    this.waitForGif()
    if (msg == "Geolocalisation") {
      this.delay(2000).then( () => { this.chat.first("je veux faire par geolocalisation"); this.chat.getLocation() })
    } else if (msg == "Code Postal") {
      this.delay(2000).then( () => { this.chat.first("je veux faire par code postal") })
    } else if (msg == "Mon Immatriculation") {
      this.delay(2000).then( () => { this.chat.first("je veux faire par immatriculation") })
    } else if (msg == "Mon Vehicule") {
      this.delay(2000).then( () => { this.chat.first("je veux faire par voiture"); this.appelVehicule() })
    }
     else if (objButton == "Recevoir un mail ?") {
      if (msg == "oui") {
        this.delay(2000).then( () => { this.chat.first("je veux recevoir un mail") })
      } else {
        this.delay(2000).then( () => { this.chat.first("je veux donner mon avis") })

      }
    }
  }

  //Clic sur un bouton confirmation FACEBOOK MESSENGERS "Quick Replies"
  confirmationActionButton(msg:string, objButton:any) {
    if (objButton == "vehicule") {
      if (msg == "oui") {
        this.chat.first("je veux faire une recherche de magasin")
      } else {
        this.chat.first("salut")
      }
    } else if (objButton == "magasin") {
      if (msg =="oui") {
        this.rechercheFiltre()
      } else {
        this.statusMag = false;
        this.chat.first("je veux faire une recherche de magasin")
      }
    }
  }

  //Recherche de vehicule par marque : chargement de toutes les marques
  appelVehicule() {
    this.callMarquesExecution()
    this.chat.getAllVehicule().subscribe((data)  => { this.chargementListeMarques(data) })
  }

  //Valide un marque avec le select : charge les libelles modeles selon la marque selectionnée
  changeMarque(event:any, idMarque:string) {
    this.callModelesExecution()
    if(event.isUserInput) {
      this.marque = idMarque
      this.chat.getAllModele_LibelleVehicule(this.marque).subscribe((data) => { this.chargementListeModeles(data) })
    }
  }

  //Valide un modele avec select : charge les libelles cylindres selon le modele selectionné
  changeModeles(event:any, libelleModele:string) {
    this.callCylindreExecution()
    if(event.isUserInput) {
      this.modele = libelleModele
      this.chat.getAllCylindre_LibelleVahicule(this.marque,libelleModele).subscribe((data)  => { this.chargementListeCylindres(data) })
    }
  }

  //Valide un Cylindre avec select : termine d'identifier le véhicule avec la recherche de l'id_speVehicule et idModele
  changeCylindre(event:any, idCylindre:string) {
    if(event.isUserInput) {
      this.marqueIsOK = true
      this.cylindre = idCylindre
      this.affectationIdModele(idCylindre)
    }
  }

  //Valide la saisie de la plaque : recherche si la plaque existe dans la base de donnée sinon recherche par "marque"   //France 002 - Espagne 501 - Italie 701 - Maroc 400
  ValiderImmatriculation() {
    this.chat.getVehiculeImmat(this.carImmatriculation, "002").subscribe((data)  => { this.checkPlaqueIsBase(data) })
  }

  //Valide la saisie marque modele cylindree pour afficher le message de confirmation (utilisation de l'idVehiculeSepcifique et kType)
  ValiderMarque() {
    this.chat.getVehiculeMarque(this.id_vehiculeSpe, this.id_ktype).subscribe((data) => { this.confirmationVehicule(data) })
  }

  //Valide un code postal
  validerCodePostal() {
    this.chat.converse(this.codePostal)
  }

  //Valide un mail
  validerEmail() {
    this.sendMailServeur()
    this.chat.first("envoi du mail en cours")
    this.delay(2000).then( () => { this.chat.first("je veux donner mon avis") })

  }

  //Envoi un mail avec la fonction dans chatService - request http serveur nodeJs mail
  sendMailServeur() {
    let dataMail = {
      email: this.email,
      estimation: this.estimationAffichage

    }
    this.chat.sendEmail("http://localhost:3000/sendmail", dataMail).subscribe((data) => { console.log(data) })
  }

  //Valide un avis avec la fonction dans chatService - request http post pour add l'avis dans la BDD
  validerAvis(note:number, commentaire:string) {
   let avis = new Avis(note, commentaire, this.id_estimation)
   this.chat.addAvis(avis).subscribe(data => { console.log(data) })
   this.discussionInput = true;
   this.chat.first("Remerciement")
  }

  //Clic sur un magasin
  magasinChoisi(dataMagasin:any, mag:string) {
    //Peut-être chargé plus d'element pour le futur mail qui se trouve dans dataMagasin
    this.statusMag = true
    this.id_magasin = mag
    this.chat.first(mag)
    this.delay(1000).then( () => { this.chat.converseMagOnly("Etes vous certain de choisir ce magasin ?") })
  }

  //Clic sur un bon Plan
  bonPlanChoisi(huile:ArticleRechercher) {
    this.statusBonPlans = true;
    this.estimation = new Estimation('', 'France', this.marque, this.modele, this.cylindre, this.filtreSelected.id, huile.id, 1, null, "M"+this.id_magasin, this.chat.codePostal)
    this.chat.addEstimation(this.estimation).subscribe(data => {
      let newArray = Object.values(data)
      let prixTotal = this.getTotalPrix(huile.prix,this.filtreSelected.prix)
      this.id_estimation = newArray[0]
      this.estimationAffichage = new EstimationAffichage(this.id_estimation, this.getToday(), this.id_magasin, this.marque, this.modele, this.cylindre, huile, this.filtreSelected, null, prixTotal)
      this.chat.first("courrier electronique")
    })
  }

  //Il faut d'abord faire la recherche filtre - Puis après Filtre
  rechercheFiltre() {
    this.id_magasin=this.id_magasin.replace('M','')
    this.chat.getAllFiltreIma(this.id_vehiculeSpe, this.carImmatriculation, this.id_magasin).subscribe(data => { this.addFiltre(data) })
  }

  //Clic sur un filtre - recherche les huiles compatibles
  filtreChoisi(filtre:any) {
    this.statusFiltre = true;
    this.filtreSelected = filtre;
    this.chat.getAllhuile(this.marque, this.modele, this.cylindre).subscribe((data:any)  => {
      if(!Array.isArray(data.KeyValueOfstringstring)) {
        this.oneKeyHuile(data)
      } else {
        this.moreKeysHuile(data)
      }
    })

    this.delay(4000).then( () => {
      if(this.ListHuiles.length == 0) {
        this.chat.first("Nous sommes navrés")
        this.problemeStock("HUILE")
      } else {
        this.prepareBonPlans(this.ListHuiles)
      }
    })
  }

//VALCO  //ARECA //ELF //SHELL //TOTAL //CASTROL //MOBIL
  //Prépare les 3 bons plans avec la liste d'huile compatibles avec le véhicule A OPTIMISER
  prepareBonPlans(huile) {
    let bonPlans = [];
    this.trierHuiles(huile)
    console.log(huile)
    if(huile.find(item => item.libelleMarque === "VALCO" ) != undefined) {
      bonPlans.push(huile.find(item => item.libelleMarque === "VALCO" ))
      bonPlans.push(huile.find(item => item.libelleMarque === "ARECA" ))
      if(huile.find(item => item.libelleMarque === "TOTAL" ) != undefined) {
        bonPlans.push(huile.find(item => item.libelleMarque === "TOTAL" ))
      } else {
        bonPlans.push(huile.find(item => item.libelleMarque === "ELF" ))
      }
    } else {
      bonPlans.push(huile.find(item => item.libelleMarque === "ARECA" ))
      if(huile.find(item => item.libelleMarque === "TOTAL" ) != undefined) {
        bonPlans.push(huile.find(item => item.libelleMarque === "TOTAL" ))
        bonPlans.push(huile.find(item => item.libelleMarque === "SHELL" ))
      } else {
        bonPlans.push(huile.find(item => item.libelleMarque === "ELF" ))
        bonPlans.push(huile.find(item => item.libelleMarque === "SHELL" ))
      }
    }
    this.listBonPlans = bonPlans
    this.chat.converseBonPlans(this.listBonPlans)
  }

  //Trie les huiles de la liste compatibles du -chère au +chère
  trierHuiles(huile) {
    huile.sort(function(a, b) {
      return a.prix-b.prix
    })
  }

  //Si la réponse du WEB Service getHuile retourne 1 seul clef pour un autre appel
  oneKeyHuile(data) {
    console.log("One Key")
    console.log(data)
    this.chat.getAllarticleHuile(data.KeyValueOfstringstring.Key, this.id_magasin).subscribe((data2:any)  => {
      console.log(data2)
      if(!Array.isArray(data2.ComponentDTO[0].Articles.article)) {
        console.log("Un seul Article")
        console.log(data2.ComponentDTO[0].Articles.article)
        if(data2.ComponentDTO[0].Articles.article.Stock!=null) {
          let stock = data2.ComponentDTO[0].Articles.article.Stock
          let prix = data2.ComponentDTO[0].Articles.article.Prix
          if(stock!=0 ) {
            let capHuile =data2.ComponentDTO[0].Articles.article.Caracteristiques.caracteristique[3].Libelle; // capaciteHuileVehicule : "Capacité X,X litre" ou "Capacité filtre"
            capHuile=capHuile.split(" ")[1]; // capaciteHuileVehicule : "X,X"
            if(capHuile=="filtre") { //si "filtre" alors --> "5,0"
              capHuile="5,0";
            }
            let capHuile1=parseFloat(capHuile.replace(',','.')); // capaciteHuileVehicule : "X.X"
            let refEquipementier=data2.ComponentDTO[0].Articles.article.ReferenceEquipementier; // recup ref
            let image="/assets/"+data2.ComponentDTO[0].Articles.article.Image; // recup img
            let libelle = data2.ComponentDTO[0].Articles.article.Libelle; // recup libelle article huile : "5W30 TOTAL XL (C3, QUARTZ INEO MC3, 502-504 )"
            let libelleMarque = libelle.split(" ")[1];
            let gererLibelle=libelle.split(" ")[2]; //libelle article huile : "XL"
            gererLibelle=+gererLibelle.replace('L',''); //libelle article huile : "X"
            console.log(gererLibelle)
            console.log(parseInt(gererLibelle))
            let qte=capHuile1/parseFloat(gererLibelle); // Calcule combien de fois il faut prendre le bidon
            qte=Math.round(qte);
            let totalPrixHuile = (prix*qte).toFixed(2)
            if(qte<stock && gererLibelle == 5) {
              let addHuile = new ArticleHuile(refEquipementier,qte,libelle,libelleMarque,prix,stock+"",capHuile,totalPrixHuile,image)
              this.ListHuiles.push(addHuile);
            }
          }
        }
      } else {
        for (let j = 0; j < Object.keys(data2.ComponentDTO[0].Articles.article).length; j++) { // POur chaque article diponible
          if(data2.ComponentDTO[0].Articles.article[j].Stock!=null) { // si article stock non null
            let stock = data2.ComponentDTO[0].Articles.article[j].Stock; // stock = stock
            let prix = data2.ComponentDTO[0].Articles.article[j].Prix; // prix = prix
            if(stock!=0 ) {
              let capHuile =data2.ComponentDTO[0].Articles.article[j].Caracteristiques.caracteristique[2].Libelle; // capaciteHuileVehicule : "Capacité X,X litre" ou "Capacité filtre"
              capHuile=capHuile.split(" ")[1]; // capaciteHuileVehicule : "X,X"
              if(capHuile=="filtre") { //si "filtre" alors --> "5,0"
                capHuile="5,0";
              }
              let capHuile1=parseFloat(capHuile.replace(',','.')); // capaciteHuileVehicule : "X.X"
              let remplacer =""; // ??
              let refEquipementier=data2.ComponentDTO[0].Articles.article[j].ReferenceEquipementier; // recup ref
              let image="/assets/"+data2.ComponentDTO[0].Articles.article[j].Image; // recup img
              let libelle = data2.ComponentDTO[0].Articles.article[j].Libelle; // recup libelle article huile : "5W30 TOTAL XL (C3, QUARTZ INEO MC3, 502-504 )"
              let libelleMarque=libelle.split(" ")[1]; //libelle article huile : "XL"
              let gererLibelle=libelle.split(" ")[2]; //libelle article huile : "XL"
              gererLibelle=+gererLibelle.replace('L',''); //libelle article huile : "X"
              let qte=capHuile1/parseFloat(gererLibelle);  // Calcule combien de fois il faut prendre le bidon
              qte=Math.round(qte);
              let totalPrixHuile = (prix*qte).toFixed(2)
              if(qte<stock && gererLibelle == 5){
                this.ListHuiles.push(new ArticleHuile(refEquipementier,qte,libelle,libelleMarque,prix,stock+"",capHuile,totalPrixHuile,image));
              }
            }
          }
        }
      }
    })
  }

  //Si la réponse du WEB Service getHuile retourne plusieurs clef pour un autre appel
  moreKeysHuile(data) {
    console.log("Plusieurs Keys")
    console.log(data)
    for (let item of data.KeyValueOfstringstring) {
      this.chat.getAllarticleHuile(item.Key, this.id_magasin).subscribe((data2:any)  => {
        console.log(data2)
        if(!Array.isArray(data2.ComponentDTO[0].Articles.article)) {
          if(data2.ComponentDTO[0].Articles.article.Stock!=null) {
            let stock = data2.ComponentDTO[0].Articles.article.Stock
            let prix = data2.ComponentDTO[0].Articles.article.Prix
            if(stock!=0 ) {
              let capHuile =data2.ComponentDTO[0].Articles.article.Caracteristiques.caracteristique[3].Libelle; // capaciteHuileVehicule : "Capacité X,X litre" ou "Capacité filtre"
              capHuile=capHuile.split(" ")[1]; // capaciteHuileVehicule : "X,X"
              if(capHuile=="filtre") { //si "filtre" alors --> "5,0"
                capHuile="5,0";
              }
              let capHuile1=parseFloat(capHuile.replace(',','.')); // capaciteHuileVehicule : "X.X"
              let refEquipementier=data2.ComponentDTO[0].Articles.article.ReferenceEquipementier; // recup ref
              let image="/assets/"+data2.ComponentDTO[0].Articles.article.Image; // recup img
              let libelle = data2.ComponentDTO[0].Articles.article.Libelle; // recup libelle article huile : "5W30 TOTAL XL (C3, QUARTZ INEO MC3, 502-504 )"
              let libelleMarque=libelle.split(" ")[1]; //libelle article huile : "XL"
              let gererLibelle=libelle.split(" ")[2]; //libelle article huile : "XL"
              gererLibelle=+gererLibelle.replace('L',''); //libelle article huile : "X"
              console.log(gererLibelle)
              console.log(parseInt(gererLibelle))
              let qte=capHuile1/parseFloat(gererLibelle); // Calcule combien de fois il faut prendre le bidon
              qte=Math.round(qte);
              let totalPrixHuile = (prix*qte).toFixed(2)
              if(qte<stock && gererLibelle == 5) {
                let addHuile = new ArticleHuile(refEquipementier,qte,libelle,libelleMarque,prix,stock+"",capHuile,totalPrixHuile,image)
                this.ListHuiles.push(addHuile);
              }
            }
          }
        } else {
          for (let j = 0; j < Object.keys(data2.ComponentDTO[0].Articles.article).length; j++) { // POur chaque article diponible
            if(data2.ComponentDTO[0].Articles.article[j].Stock!=null) { // si article stock non null
              let stock = data2.ComponentDTO[0].Articles.article[j].Stock; // stock = stock
              let prix = data2.ComponentDTO[0].Articles.article[j].Prix; // prix = prix
              if(stock!=0 ) {
                let capHuile =data2.ComponentDTO[0].Articles.article[j].Caracteristiques.caracteristique[3].Libelle; // capaciteHuileVehicule : "Capacité X,X litre" ou "Capacité filtre"
                capHuile=capHuile.split(" ")[1]; // capaciteHuileVehicule : "X,X"
                if(capHuile=="filtre") { //si "filtre" alors --> "5,0"
                  capHuile="5,0";
                }
                let capHuile1=parseFloat(capHuile.replace(',','.')); // capaciteHuileVehicule : "X.X"
                let remplacer =""; // ??
                let refEquipementier=data2.ComponentDTO[0].Articles.article[j].ReferenceEquipementier; // recup ref
                let image="/assets/"+data2.ComponentDTO[0].Articles.article[j].Image; // recup img
                let libelle = data2.ComponentDTO[0].Articles.article[j].Libelle; // recup libelle article huile : "5W30 TOTAL XL (C3, QUARTZ INEO MC3, 502-504 )"
                let libelleMarque=libelle.split(" ")[1]; //libelle article huile : "XL"
                let gererLibelle=libelle.split(" ")[2]; //libelle article huile : "XL"
                gererLibelle=+gererLibelle.replace('L',''); //libelle article huile : "X"
                let qte=capHuile1/parseFloat(gererLibelle);  // Calcule combien de fois il faut prendre le bidon
                qte=Math.round(qte);
                let totalPrixHuile = (prix*qte).toFixed(2)
                if(qte<stock && gererLibelle == 5){
                  this.ListHuiles.push(new ArticleHuile(refEquipementier,qte,libelle,libelleMarque,prix,stock+"",capHuile,totalPrixHuile,image));
                }
              }
            }
          }
        }
      })
    }
  }

  /*
  * Liste des fonctions qui sont utilisées dans le programme
  * pour une meilleur optimisation et une meilleur compréhension
  */

  //Reset des variables
  resetVariables() {
    this.id_vehiculeSpe = "";
    this.id_ktype = "";
    this.id_magasin = "";
    this.currentRate = 0;
    this.discussionInput = false;
    this.marqueIsOK = false;
    this.plaqueIsOK = false;
    this.mailIsOK = false;
    this.codePostalIsOK = false;
    this.statusMag = false;
    this.statusFiltre = false;
    this.statusBonPlans = false;
    this.marques = [];
    this.modeles = [];
    this.cylindres = [];
    this.ListFiltres = [];
    this.ListHuiles = [];
  }

  //Selection de véhicule par marque initialisation des controleurs autocomplétions
  callMarquesExecution() {
    this.myControlMarques.setValue('');
    this.myControlModeles.setValue('');
    this.myControlCylindres.setValue('');
    this.marques = [];
  }

  //Remplition de toutes les marques selon data qui provient du WEBAPI - affectation de la liste pour le select autocomplétion
  chargementListeMarques(data:any) {
    for (let i = 0; i < Object.keys(data).length; i++) {
      let marque = new Object({value: data[i].id_marque, viewValue: data[i].lib_marque});
      this.marques.push(marque);
    }
    this.listMarques = this.marques
    this.filtrageMarques = this.myControlMarques.valueChanges.pipe(startWith(''),map(value => this.filtrer("marque", value)));
  }

  //Selection de véhicule par modèle après avoir choisi une marque - initialisation des autres controleurs autocomplétions
  callModelesExecution() {
    this.myControlModeles.setValue('');
    this.myControlCylindres.setValue('');
    this.modeles = [];
    this.cylindres = [];
  }

  //Remplition des modeles avec id_marque qui provient du WEBAPI - affectation de la liste pour le select autocomplétion
  chargementListeModeles(data:any) {
    for (var i = 0; i < Object.keys(data).length; i++) {
      let modele = new Object({viewValue: data[i].lib_modele});
      this.modeles.push(modele);
    }
    this.listModeles = this.modeles
    this.filtrageModeles = this.myControlModeles.valueChanges.pipe(startWith(''),map(value => this.filtrer("modele", value)));
  }

  //Selection du véhicule par cylindre après avoir choisi un modele - initionlisation du dernier controleur autocomplétion
  callCylindreExecution() {
    this.myControlCylindres.setValue('');
    this.cylindres=[];
  }

  //Remplition des cylindres avec id_libelle qui provient du WEBAPI - affectation de la liste pour le select autocomplétion
  chargementListeCylindres(data:any) {
    for (var i = 0; i < Object.keys(data).length; i++) {
      let annee:string = "";
      //Si il existe une année_fin : format = "(XXXX -> XXXX)" sinon "(XXXX)"
      if(data[i].annee_fin != null) {
        annee = "(" + data[i].annee_deb.split("/")[1] + " -> " + data[i].annee_fin.split("/")[1] + ")";
      } else {
        annee = "("+ data[i].annee_deb.split("/")[1] + ")";
        }
      let puissanceEnergie:string = data[i].Puissance;
      let cylindre = new Object({value: data[i].id_cylindre, viewValue: data[i].lib_cylindre + " " + puissanceEnergie + " " + annee});
      this.cylindres.push(cylindre);
    }
    this.listCylindres = this.cylindres
    this.filtrageCylindres = this.myControlCylindres.valueChanges.pipe(startWith(''),map(value => this.filtrer("cylindre", value)));
  }

  //Recherche de l'id_modele & id_speVehicule avec id_cylindre qui est unique
  affectationIdModele(idCylindre:string) {
    this.chat.getIdModele_withIdCylindre(this.marque, idCylindre).subscribe((data) => {
      this.modele = data[0].id_modele
      this.id_vehiculeSpe = data[0].numveh
      this.id_ktype = data[0].ktype
    })
  }

  //Check si la plaque appartient à la base : si oui confirme le véhicule - sinon il renvoit sur le formulaire marque - modele - cylindre "appelVehicule()"
  checkPlaqueIsBase(data:any) {
    if(Object.keys(data).length < 2) {
      this.chat.first("La plaque d'immatriculation n'existe pas")
      this.delay(1000).then( () => { this.chat.first("je veux faire par voiture") })
      this.appelVehicule();
    } else {
      this.confirmationVehicule(data)
      this.id_vehiculeSpe = data.vehicule.IdVehiculeSpecifique;
      this.marque = data.vehicule.Marque.Id;
      this.modele = data.vehicule.Modele.Id;
      this.cylindre = data.vehicule.Cylindree.Id;
      }
  }

  //Phrase de confirmation véhicule
  confirmationVehicule(data:any) {
    console.log(data)
    this.libelleMarque = data.vehicule.Marque.Libelle
    this.libelleModele = data.vehicule.Modele.Libelle
    this.libelleCylindre = data.vehicule.Cylindree.Libelle
    let phrase:string
    let annee:string
    if( typeof(data.vehicule.Cylindree.AnneeFin) == "string" ) {
      annee = `(${ data.vehicule.Cylindree.AnneeDebut } -> ${ data.vehicule.Cylindree.AnneeFin })`
    } else {
      annee = `(${ data.vehicule.Cylindree.AnneeDebut } ->)`
    }
    phrase = `${ data.vehicule.Marque.Libelle } ${ data.vehicule.Modele.Libelle } ${ data.vehicule.Carrosserie }
              ${ data.vehicule.Cylindree.Libelle } ${ data.vehicule.Cylindree.PuissanceMoteurCV }ch ${ data.vehicule.Cylindree.Carburant } ${ annee }
              `
    this.chat.converseMarqueOnly(`Merci ! Pouvez-vous me confirmer que votre véhicule est bien une : ${ phrase }`)
  }

  //Le bordel du addFiltre à cause de WEBSERVICE - Il existe des cas d'erreur
  addFiltre(data) {
    console.log("DATA FILTRE WEBAPI")
    console.log(data)
    if(!Array.isArray(data)) {
      if (!data.infoCom.hasOwnProperty('$')) {
        if (data.infoCom.stock != "0") {
          let img = ""
          let stock = data.infoCom.stock
          let prix = data.infoCom.pvttc
          let libelle = data.infoCom.libelle_article
          let codeArticle = data.infoCom.code_article
          if (!Array.isArray(data.Medias.Image)) {
            console.log("Une seul image dispo")
            img = "/assets/"+data.Medias.Image.path_img
          } else {
            img = "/assets/"+data.Medias.Image[0].path_img
          }
          let infoDate = ""
          if (data.Caracteristiques.Caracteristique[8]) {
            if (data.Caracteristiques.Caracteristique[8].lib_info == "Année à partir de") {
              infoDate = `Pour les véhicules mis en circulation à partir de ${ data.Caracteristiques.Caracteristique[8].val_info }`
            } else if (data.Caracteristiques.Caracteristique[8].lib_info == "Année jusqu'à") {
              infoDate = `Pour les véhicules mis en circulation jusqu'à ${ data.Caracteristiques.Caracteristique[8].val_info }`
            } else {
              infoDate = ""
            }
          }
          let caracteristiques = {
            data: `${ infoDate }`,
            hauteur: `${ data.Caracteristiques.Caracteristique[6].val_info }`,
            diametreInterieur: `Diam:_/${ data.Caracteristiques.Caracteristique[2].val_info }/${ data.Caracteristiques.Caracteristique[3].val_info }`,
            diametreExterieur: `${ data.Caracteristiques.Caracteristique[7].val_info }`,
            taraudage: `${ data.Caracteristiques.Caracteristique[4].val_info  }`
          }
          let filtreToAdd = new ArticleFiltre(codeArticle, 1, libelle, prix, stock, img, caracteristiques)
          this.ListFiltres.push(filtreToAdd)
          console.log(this.ListFiltres)
        }
      }
    } else {
      for (var i = 0; i < Object.keys(data).length; i++) {
        console.log(data[i])
        if (!data[i].infoCom.hasOwnProperty('$')) {
          if (data[i].infoCom.stock != "0") {
            let img = ""
            let stock = data[i].infoCom.stock
            let prix = data[i].infoCom.pvttc
            let libelle = data[i].infoCom.libelle_article
            let codeArticle = data[i].infoCom.code_article
            if (!Array.isArray(data[i].Medias.Image)) {
              console.log("Une seul image dispo")
              img = "/assets/"+data[i].Medias.Image.path_img
            } else {
              img = "/assets/"+data[i].Medias.Image[0].path_img
            }
            let infoDate = ""
            if (data[i].Caracteristiques.Caracteristique[8]) {
              if (data[i].Caracteristiques.Caracteristique[8].lib_info == "Année à partir de") {
                infoDate = `Pour les véhicules mis en circulation à partir de ${ data[i].Caracteristiques.Caracteristique[8].val_info }`
              } else if (data[i].Caracteristiques.Caracteristique[8].lib_info == "Année jusqu'à") {
                infoDate = `Pour les véhicules mis en circulation jusqu'à ${ data[i].Caracteristiques.Caracteristique[8].val_info }`
              } else {
                infoDate = ""
              }
            }
            let caracteristiques = {
              date: `${ infoDate }`,
              hauteur: `${ data[i].Caracteristiques.Caracteristique[6].val_info }`,
              diametreInterieur: `Diam:_/${ data[i].Caracteristiques.Caracteristique[2].val_info }/${ data[i].Caracteristiques.Caracteristique[3].val_info }`,
              diametreExterieur: `${ data[i].Caracteristiques.Caracteristique[7].val_info }`,
              taraudage: `${ data[i].Caracteristiques.Caracteristique[4].val_info  }`
            }
            let filtreToAdd = new ArticleFiltre(codeArticle, 1, libelle, prix, stock, img, caracteristiques)
            this.ListFiltres.push(filtreToAdd)
          }
        }
      }
    }
    if(this.ListFiltres.length == 0) {
      this.chat.first("Nous sommes navrés")
      this.problemeStock("FILTRE")
      this.discussionInput = true
    } else if (this.ListFiltres.length == 1) {
      this.filtreChoisi(this.ListFiltres[0])
    } else {
      this.chat.converseFiltreProposition(this.ListFiltres)
    }
  }

  //Observer les champs autocomplétions selon le champ marque, modele ou cylindre
  filtrer(name:string, value:any): any[] {
    if(name == 'marque') {
      return this.listMarques.filter(option => option.viewValue.toLowerCase().includes(value.toLowerCase()));
    } else if (name == 'modele') {
      return this.listModeles.filter(option => option.viewValue.toLowerCase().includes(value.toLowerCase()));
    } else if (name == 'cylindre') {
      return this.listCylindres.filter(option => option.viewValue.toLowerCase().includes(value.toLowerCase()));
    }
  }

  //Check si la plaque repecte l'expréssion régulière des plaques
  checkPlaque() {
    this.carImmatriculation = this.carImmatriculation.toUpperCase()
    let newPlaque = new RegExp(/^[A-Z]{2,2}[0-9]{3,3}[A-Z]{2,2}$/)
    let oldPlaque = new RegExp(/^[0-9]{2,4}[A-Z]{2,2}[0-9]{2,2}$/)
    if(newPlaque.test(this.carImmatriculation) || oldPlaque.test(this.carImmatriculation)) {
      this.plaqueIsOK = true
    } else {
      this.plaqueIsOK = false
    }
  }

  //Check si le mail respecte l'expréssion régulière
  checkMail() {
    let emailRegEx = new RegExp(/^[_a-z0-9-]+(.[_a-z0-9-]+)*@[a-z0-9-]+(.[a-z0-9-]+)*(.[a-z]{2,4})$/)
    if(emailRegEx.test(this.email)) {
      this.mailIsOK = true
    } else {
      this.mailIsOK = false
    }
  }

  //Check si le codePostal  respecte l'expréssion régulière
  checkCodePostal() {
    let codeRegEx = new RegExp(/^((0[1-9])|([1-8][0-9])|(9[0-8])|(2A)|(2B))[0-9]{3}$/)
    if(codeRegEx.test(this.codePostal)) {
      this.codePostalIsOK = true
    } else {
      this.codePostalIsOK = false
    }
  }

  //setTimeout en ms pour effectuer une fonction après le temps écoulé
  delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }

  //affiche le gif en cours d'écriture pour 2sec
  waitForGif() {
    this.showGif = true
    this.delay(2000).then( () => { this.showGif = false });
  }

  //Retourne le prix total d'une estimation (Huile + Filtre + 15 main d'oeuvre + 1.60 joint)
  getTotalPrix(prixHuile:string, prixFiltre:string) {
    let prixTotal:any
    prixTotal = parseFloat(prixHuile) + parseFloat(prixFiltre) + 15 + 1.60
    return parseFloat(prixTotal).toFixed(2);
  }

  //Retourne la date d'aujourd'hui sous la forme "jour/mois/année"
  getToday() {
    let day = new Date()
    return day.toLocaleDateString()
  }

  problemeStock(typeIndisponible:string) {
   let stockIndispo = new StockIndisponible(typeIndisponible, this.id_ktype, this.id_vehiculeSpe, this.id_magasin, this.libelleMarque, this.libelleModele, this.libelleCylindre)
   this.chat.addStockIndispo(stockIndispo).subscribe(data => { console.log(data) })
  }

}
