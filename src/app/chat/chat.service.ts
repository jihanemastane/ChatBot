import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { HttpClient } from '@angular/common/http';
import { ApiAiClient } from 'api-ai-javascript/es6/ApiAiClient'

//Class
export class Article {
  constructor(public id: string, public idVoiture: string, public libelle: string, public description: string, public prix: string, public type: string, public urlimage: string) {}
}

export class CardMagasin {
  constructor(public mag: Array<Magasin>) {}
}

export class CardHuile {
  constructor(public huiles: Array<ArticleHuile>) {}
}

export class CardFiltre {
  constructor(public filtres: Array<ArticleRechercher>) {}
}

export class Card {
  constructor(public title: string, public description: string, public imageUrl: string, public buttons: Array<butt>) {}
}

export class img {
  constructor(public title: string, public url: string) {}
}

export class buttonsCard {
  constructor(public title: string, public buttons: Array<butt>) {}
}

export class Message {
  constructor(public content: string, public type: string, public c:Card, public b:buttonsCard, public i:img, public magasin:CardMagasin, public huile :CardHuile, public filtre:Array<ArticleFiltre>, public e:EstimationAffichage, public sentBy: string) {}
}

export class butt {
  constructor(public content: string, public url: string) {}
}

export class Magasin {
  constructor(public idStore: string, public pays: string, public ville: string, public codePostal: string, public adresse: string , public telephone: string, public lat: Float32Array, public lng: Float32Array, public ouverture: string, public managerEmail: string, public link:string, public linkImage:string, public km:number) {}
}

export class ArticleHuile {
  constructor(public id: string, public qte:number, public libelle: string,public libelleMarque: string, public prix: string, public stock: string, public capaciteHuile: string, public totalPrixHuile: string, public image: string) {}
}

export class ArticleFiltre {
  constructor(public id: string, public qte:number, public libelle: string, public prix: string, public stock: string, public image: string, public caracteristiques: object) {}
}

export class ArticleRechercher {
  constructor(public id:string, public qte:string, public libelle:string, public prix:string, public stock:string, public image:string) {}
}

export class EstimationAffichage {
  constructor(public id_estimation: string, public date:string, public nummag:string, public marque:string, public modele:string, public cylindre:string, public huile:ArticleRechercher, public filtre:ArticleFiltre, public joint:ArticleRechercher, public prix:string) {}
}

export class Estimation {
  constructor(public id_estimation:string, public pays:string, public marque:string, public modele:string, public cylindre:string, public id_filtre:string, public id_huile:string, public qte_huile:number, public id_joint: string, public idStore:string, public codePostal :string) {}
}

export class Avis {
  constructor(public note:number, public commentaire:string, public id_estimation:string) {}
}

export class StockIndisponible {
  constructor(public type:string, public ktype:string, public id_vehiculeSpe:string, public id_magasin:string, public libelle_marque:string, public libelle_modele:string, public libelle_cylindre:string) {}
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  readonly token = environment.dialogflow.angularBot;
  readonly client = new ApiAiClient({accessToken: this.token});
  conversation = new BehaviorSubject<Message[]>([]);

  constructor(private httpClient: HttpClient ) {}

  urlGlobal:string = "http://localhost:3000";
  codePostal:string;

  lat:number = 0;
  lng:number = 0;
  limitKm:number = 100;
  sizeM:number;
  dist:number;

  LatLongIsOk:boolean = true;

  listMags:Array<Magasin> = [];

  //Donne une phrase à dialogflow sans voir son propre message côté client - le chatbot retourne directement la réponse sans l'intervention du l'utilisateur
  first(msg :string) {
    this.botReponse(msg);
  }

  //Lance la conversation suivant avec le message
  update(msg: Message) {
    this.conversation.next([msg]);
  }

  //Get All Magasin { idStore, pays, ville, codePostal, adresse, telephone, latitude, longitude, ouverture, data_ouverture, managerEmail, hidden, ouvertureJSON }
  getAllMagasin() {
    return this.httpClient.get(this.urlGlobal + `/api/store`);
  }

  //Get un filtre par immatriculation { Caracteristiques, Medias, InfoFiltre, reference, numeroArticle }
  getAllFiltreIma(numVehiculeSpe:string, immatriculation:string, idMagasin:string) {
    return this.httpClient.get(this.urlGlobal + `/api/Filtrerecherche/${ numVehiculeSpe }/${ immatriculation }/${ idMagasin }`);
  }

  //Add one estimation Database { pays, marque, modele, cylindre, id_filtre, id_huile, qte_huile, id_joint, idStore, codePostal }
  addEstimation(e:Estimation) {
    return this.httpClient.post(this.urlGlobal + `/api/Estimation`, e);
  }

  //Add one avis Database { note, commentaire, id_estimation }
  addAvis(a:Avis) {
    return this.httpClient.post(this.urlGlobal + `/api/Avis`, a);
  }

  addStockIndispo(s:StockIndisponible) {
    return this.httpClient.post(this.urlGlobal + `/api/StockIndisponible`, s);
  }

  //Get un vehicule à partir de la plaque et du magasin { modele, marque, cylindree, KType, IdVehiculeSpecifique, Carrosserie, codeMoteur }
  getVehiculeImmat(immatriculation:string, idMagasin:string) {
    return this.httpClient.get(this.urlGlobal + `/api/rechercherVehiculeImmat/${ immatriculation }/${ idMagasin }`);
  }

  //Get un véhicule à partir de l'idVehiculeSepcifique et le Ktype { modele, marque, cylindree, KType, IdVehiculeSpecifique, Carrosserie, codeMoteur }
  getVehiculeMarque(idVehiculeSpecifique:string, kType:string) {
    return this.httpClient.get(this.urlGlobal + `/api/rechercheVehiculeSpeKtype/${ idVehiculeSpecifique }/${ kType }`);
  }

  //Get All marque de vehicule { id_marque, lib_marque }
  getAllVehicule() {
    return this.httpClient.get(this.urlGlobal + `/api/voiture/marque`);
  }

  //Get tout les articles Huiles { Toutes les informations sur les huiles }
  getAllarticleHuile(key:string, idMagasin:string) {
    return this.httpClient.get(this.urlGlobal + `/api/rechercherHuile/${ key }/${ idMagasin }`);
  }

  // Get All libelle_modele { lib_modele }
  getAllModele_LibelleVehicule(idMarque:string) {
    return this.httpClient.get(this.urlGlobal + `/api/voiture/marque/libelleModele/${ idMarque }`)
  }

  // Get All Cylindre { id_cylindre, lib_cylindre, annee_deb, annee_fin, Puissance, Energie }
  getAllCylindre_LibelleVahicule(idMarque:string, libelleModele:string) {
    return this.httpClient.get(this.urlGlobal + `/api/voiture/marque/libelleModele/libelleCylindre/${ idMarque }/${ libelleModele }`)
  }

  // Get id_modele and numVehiculeSpe { id_modele, numveh }
  getIdModele_withIdCylindre(idMarque:string, idCylindre:string) {
    return this.httpClient.get(this.urlGlobal + `/api/voiture/marque/idModele/libelleCylindre/${ idMarque }/${ idCylindre }`)
  }

  //Get la key pour faire ensuite la recherche de l'huile { $, KeyValueOfstringstring[ key, value ] }
  getAllhuile(idMarque:string, idModele:string, idCylindre:string) {
    return this.httpClient.get(this.urlGlobal + `/api/voiture/marque/modele/cylindre/${ idMarque }/${ idModele }/${ idCylindre }`);
  }

  //NOT USED
  getArticle(numMagasin:string, ref:string) {
    return this.httpClient.get(this.urlGlobal + `/api/recherche/${ numMagasin }/${ ref }`);
  }

  //NOT USED
  getAllModeleVehicule(idMarque:string) {
    return this.httpClient.get(this.urlGlobal + `/api/voiture/marque/modele/${ idMarque }`);
  }

  //NOT USED
  getAllCylindreVehicule(idMarque:string, idModele:string) {
    return this.httpClient.get(this.urlGlobal + `/api/voiture/marque/modele/cylindre/${ idMarque }/${ idModele }`);
  }

  //Send un mail avec la data de l'estimation
  sendEmail(url, data) {
    return this.httpClient.post(url, data);
  }

  //Préparation de la réponse du bot avec dialogflow en fonction du message  msg
  botReponse(msg:string) {
    return this.client.textRequest(msg)
        .then(res => {
          console.log(res)
          const intent = res.result.metadata.intentName;
          for (var i = 0; i < res.result.fulfillment.messages.length; i++) {
            var result = res.result.fulfillment.messages[i];
            if(result.platform =="facebook") {
              if(result.type == 0) {
                let speech = res.result.fulfillment.messages[i].speech;
                console.log(speech)
                if(intent == "code postal") {
                  this.codePostalResponse(speech, res.result.resolvedQuery);
                }
                else if(intent=="Selection Immatriculation") {
                  const botMessageFirst = new Message(speech,'0',null,null,null,null,null,null,null, 'bot');
                  this.update(botMessageFirst);
                  const botMessage = new Message(speech,'7',null,null,null,null,null,null,null, 'bot');
                  this.update(botMessage);
                }
                else if(intent=="Selection Voiture" || intent=="Selection Voiture 2") {
                  const botMessageFirst = new Message(speech,'0',null,null,null,null,null,null,null, 'bot');
                  this.update(botMessageFirst);
                  const botMessage = new Message(speech,'8',null,null,null,null,null,null,null, 'bot');
                  this.update(botMessage);
                }
                else if(intent=="Selection Code Postal") {
                  const botMessageFirst = new Message(speech,'0',null,null,null,null,null,null,null, 'bot');
                  this.update(botMessageFirst);
                  const botMessage = new Message(speech,'14',null,null,null,null,null,null,null, 'bot');
                  this.update(botMessage);
                }
                else if(intent=="choix mail") {
                  const botMessageFirst = new Message(speech,'0',null,null,null,null,null,null,null, 'bot');
                  this.update(botMessageFirst);
                  const botMessage = new Message(speech,'11',null,null,null,null,null,null,null, 'bot');
                  this.update(botMessage);
                }
                else if(intent=="choix avis") {
                  const botMessageFirst = new Message(speech,'0',null,null,null,null,null,null,null, 'bot');
                  this.update(botMessageFirst);
                  const botMessage = new Message(speech,'12',null,null,null,null,null,null,null, 'bot');
                  this.update(botMessage);
                }
                else {
                  const botMessage = new Message(speech,'0',null,null,null,null,null,null,null, 'bot');
                  this.update(botMessage);
                }
              }
              else if(result.type == 1) {
                const title = result.title;
                const description = result.subtitle;
                const imageUrl = result.imageUrl;
                const bu = new Array<butt>();
                for (var j = 0; j < result.buttons.length ; j++) {
                  bu.push(new butt(result.buttons[j].text,result.buttons[j].postback));
                }
                const card =  new Card(title,description,imageUrl,bu);
                const botMessage = new Message('','1',card,null,null,null,null,null,null, 'bot');
                this.update(botMessage);
              }
              else if(result.type==2) {
                const title = result.title;
                const bu = new Array<butt>();
                for (var j = 0; j < result.replies.length ; j++) {
                  bu.push(new butt(result.replies[j],result.replies[j]+"()"));
                }
                const buttonsC =  new buttonsCard(title, bu);
                const botMessage = new Message('','2',null,buttonsC,null,null,null,null,null, 'bot');
                this.update(botMessage);
              }
              else if(result.type==3) {
                const url = result.imageUrl;
                const im = new img("", url);
                const botMessage = new Message('','3',null,null,im,null,null,null,null, 'bot');
                this.update(botMessage);
              }
            }
          }
        })
  }

  //Debut de la conversation avec 'Bonjour ! Je suis Oilbot'
  converseStart(msg:string) {
    const botMessage = new Message(msg,'0',null,null,null,null,null,null,null,'bot');
    this.update(botMessage);
  }

  //Création d'un message simple type 0
  converse(msg:string) {
    this.botReponse(msg);
    const userMessage = new Message(msg,'0',null,null,null,null,null,null,null,'user');
    this.update(userMessage);
  }

  //Confirmation du bot après le selection de l'immatriculation ou marque
  converseMarqueOnly(msg:string) {
    const userMessage = new Message(msg,'0',null,null,null,null,null,null,null,'bot');
    this.update(userMessage);

    let bu = [new butt("oui", ''), new butt("non",'')]
    let quickReplies = new buttonsCard('vehicule', bu)
    this.confirmationEntree(quickReplies);
  }

  //Confirmation du bot après la selection du magasin
  converseMagOnly(msg:string) {
    let bu = [new butt("oui", ''), new butt("non",'')]
    let quickReplies = new buttonsCard('magasin', bu)
    this.confirmationEntree(quickReplies);
  }

  // Lancement du message oui / non confirmation
  confirmationEntree(cardReplies:buttonsCard) {
    const botMessage = new Message('','5',null,cardReplies,null,null,null,null,null,'bot');
    this.update(botMessage)
  }

  //Création du message final Estimation affichage du type 9
  converseDevis(msg:string, estimationAffichage:EstimationAffichage) {
    const botMessageFirst = new Message("Impeccable ! Vous disposez maintenant du montant estimé de votre vidange dans notre magasin Carter-Cash. ",'0',null,null,null,null,null,null,null, 'bot');
    this.update(botMessageFirst);
    const userMessage = new Message(msg,'9',null,null,null,null,null,null,estimationAffichage,'user');
    this.update(userMessage);
    this.first("courrier électronique")
  }

  //Création du message du type Huile 6
  converseHuile(msg:string, listeHuile:CardHuile) {
    const botMessageFirst = new Message("Plusieurs huiles correspondent à votre véhicule. Je vous laisse choisir le plus adapté !",'0',null,null,null,null,null,null,null, 'bot');
    this.update(botMessageFirst);
    const userMessage = new Message(msg,'6',null,null,null,null,listeHuile,null,null,'user');
    this.update(userMessage);
  }

  converseFiltreProposition(listFiltre:Array<ArticleFiltre>) {
    const botMessageFirst = new Message("Plusieurs filtres à huiles correspondent à votre véhicule. Je vous laisse choisir le plus adapté :",'0',null,null,null,null,null,null,null, 'bot');
    this.update(botMessageFirst);
    const userMessage = new Message('','10',null,null,null,null,null,listFiltre,null,'user');
    this.update(userMessage);

  }

  converseBonPlans(bonPlans) {
    const botMessageFirst = new Message("Il vous reste à choisir parmi nos différents forfaits. Là encore, c'est vous qui décidez :",'0',null,null,null,null,null,null,null, 'bot');
    this.update(botMessageFirst);
    const userMessage = new Message('','13',null,null,null,null,null,bonPlans,null,'user');
    this.update(userMessage);
  }

  //API Geoloc pour envyer un code postal par la data latitude et longitude
  callApiGeolocalisation(longitude:number, latitude: number) {
    const url=`https://us1.locationiq.com/v1/reverse.php?key=139d11b1b77642&lat=${ latitude }&lon=${ longitude }&format=json`;
    this.httpClient.get(url).subscribe((data:any) => {
      this.codePostal = data.address.postcode;
      this.converse(this.codePostal);
    });
  }

  //Calcul de distance entre 2 points (latitude&longitude 1) - (latitude&longitude 2)
  distance(lat1:number, lon1:number, lat2:number, lon2:number) {
    if ((lat1 == lat2) && (lon1 == lon2)) {
      return 0;
    }
    else {
      var radlat1 = Math.PI * lat1/180;
      var radlat2 = Math.PI * lat2/180;
      var theta = lon1-lon2;
      var radtheta = Math.PI * theta/180;
      this.dist = 0;
      this.dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
      if (this.dist > 1) {
        this.dist = 1;
      }
      this.dist = Math.acos(this.dist);
      this.dist = this.dist * 180/Math.PI;
      this.dist = this.dist * 60 * 1.1515;
      this.dist = this.dist * 1.609344;
    }
  }

  //Active la localisation gps pour avoir les coordonnées latitude et longitude
  getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position: Position) => {
        if (position) {
          this.lat = position.coords.latitude;
          this.lng = position.coords.longitude;
          this.callApiGeolocalisation(this.lng,this.lat);
        }
      },
        (error: PositionError) => console.log(error));
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }

  //Donne la response à dialflow si l'intent est Code POSTAL
  codePostalResponse(speech:string, codePostal:string) {
    this.LatLongIsOk = false
    if(!this.LatLongIsOk) {
      this.codePostal = codePostal
      this.callApiCodePostal(this.codePostal, speech)
    }
    if(this.LatLongIsOk) {
      this.alloMagasin(speech);
    }
  }

  //Obtient des cordonnées latitude et longitude avec un code postal écrit dans le message
  callApiCodePostal(msg:string, speech:string) {
    const url=`https://eu1.locationiq.com/v1/search.php?key=139d11b1b77642&q=${ msg }&format=json`;
    this.httpClient.get(url).subscribe(data => {
      for (var i = 0; i < Object.keys(data).length; i++) {
        var s = data[i].display_name.split(",");
        s = s[s.length-1].substr(1);
        if(s == "France") {
          this.lat = data[i].lat;
          this.lng = data[i].lon;
        }
      }
      this.alloMagasin(speech)
      this.LatLongIsOk = true
    });
  }

  //Réponse de la requete getAllMagasin : si un magasin est proche des données latitude et longitude alors push
  alloMagasin(speech: any) {
    this.getAllMagasin().subscribe(dat  => {
      this.listMags = []
      this.sizeM = Object.keys(dat).length; //sizeM = magasins
      for (var i = 0; i < this.sizeM; i++) { //boucle sur tout les magasins carter-cash
        this.distance(dat[i].lat, dat[i].lng, this.lat, this.lng);
        if(this.dist < this.limitKm) { //si distance < limite : add magasin
          var ville = dat[i].ville;
          ville=ville.replace(" ","-");
          ville=ville.replace("è","e");
          ville=ville.replace("é","e");
          ville=ville.replace("'","");
          ville=ville.replace("lès","les");
          const linkImage = "https://www.carter-cash.com/images/store/page/"+ dat[i].idStore +".jpg";
          const link = "https://www.carter-cash.com/magasin/"+ ville + "-" + dat[i].codePostal + "-" + dat[i].idStore;
          this.listMags.push(new Magasin (dat[i].idStore, dat[i].pays, dat[i].ville, dat[i].codePostal, dat[i].adresse, dat[i].telephone, dat[i].lat, dat[i].lng, dat[i].ouverture, dat[i].managerEmail, link, linkImage, Math.trunc(this.dist)));
        }
      }
      this.listMags.sort(function (a, b) { //filtre le tableau du plus près au plus proche
        return a.km - b.km;
     });
      if(this.listMags.length != 0) {
        const magasins = new CardMagasin(this.listMags);
        const botMessageFirst = new Message(speech,'0',null,null,null,null,null,null,null, 'bot');
        this.update(botMessageFirst);
        const botMessage = new Message(speech,'4',null,null,null,magasins,null,null,null, 'bot');
        this.update(botMessage);
      } else {
        this.first("Aucun magasin est disponible")
        this.first("je veux faire une recherche de magasin")
      }

    });
  }

}
