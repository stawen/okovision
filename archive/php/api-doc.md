- /admin

  - /testip : test if boiler respond

  - /saveInfoGe : Save Generals Configuration

  - /getFileFromChaudiere : Get List of file avalaible on Boiler

  - /importFileFromChaudiere : Import into db with url file from boiler
  - /uploadCsv : Methode how upload CSV file into /tmp and rename it.
  - /getHeaderFromOkoCsv : Get All sensor in oko_capteur and format it into json for page Matrix
  - /statusMatrice : Test if matrix has been initiate or not.
  - /deleteMatrice : Delete all row in oko_capteur and flush all data day. But not data history.
  - /importcsv : Force import csv into db, but it's doesn't download a new file.

  - /getSaisons : get list season created into season table
  - /existSaison : Test if this date is the first date of a season
  - /setSaison : Record a new season
  - /deleteSaison : Delete season
  - /updateSaison : Update Season

  - /getEvents : Get storage Tank Event
  - /setEvent : Set storage Tank Event
  - /deleteEvent : Delete storage Tank Event
  - /updateEvent : Update storage Tank Event

  - /makeSyntheseByDay : Force Synthese for one day
  - /getDayWithoutSynthese : Detect all day who have data but not a resume day

  - /getFileFromTmp : Function return all file in \_tmp/ folder
  - /importFileFromTmp : Function importing boiler file from \_tmp/ folder

- /graphique

  - getLastGraphePosition : Get Last Position Number info oko_graphe
  - grapheNameExist : Test if graphe Name already exist
  - addGraphe : Add graphe name info oko_graphe
  - getGraphe : Get graphe property from oko_graphe
  - updateGraphe : Update graphe properties from oko_graphe
  - updateGraphePosition : Update graphe property 'Position' info oko_graphe
  - deleteGraphe : Delete all propertie for a specific graphe

  - getCapteurs : Get List of all sensor info oko_capteurs
  - grapheAssoCapteurExist : Return true if Sensor is already in graphe
  - addGrapheAsso : Insert into oko_asso_capteur_graphe association between graphic, sensor and Sensor correction effect
  - getGrapheAsso : Get Sensor associate for an Graphe in predifined order
  - updateGrapheAsso : Update sensor position into graphic
  - deleteAssoGraphe : Delete association between graphic and sensor

- /rendu

  - getGraphe : Get graphe list in order by position
  - getGrapheData : By Id and by day, get data for a graphe
  - getIndicByDay : Get Indicator for one Day (pellet kg, hot water comsuption, T°c Max and Min)
  - getIndicByMonth : Get T°c ext max/min; comsuption pellet (and HW), dju and cycle number for all day in a month
  - getStockStatus : get pellet stock remains in storage tank or bag (% and kg)
  - getAshtrayStatus : Say if Ashtray must be clean
  - getHistoByMonth : Get T°c ext max/min; comsuption pellet (and HW), dju and cycle number resumed for a month
  - getTotalSaison : Get T°c ext max/min; comsuption pellet (and HW), dju and cycle number resumed for a season
  - getSyntheseSaison : Get Synthetic data for a complete season, agregat by month for graphic render
  - getSyntheseSaisonTable : Same as getSyntheseSaison but for table render
  - getAnnotationByDay : get into oko_boiler change configuration, show it with a bar in daily chart

- /rt
  - getIndic : Get Sensor Values from determinated sensor List
  - setOkoLogin : save boiler login/password
  - getData : get all data fro mboiler for a specific chart
  - getSensorInfo : get value for one boiler sensor
  - saveBoilerConfig : Save boiler config on db
  - getListConfigBoiler : Get boiler config from db
  - deleteConfigBoiler : Delete boiler config from db
  - getConfigBoiler : get specific config for db for load into page
  - applyBoilerConfig : Apply config on boiler
