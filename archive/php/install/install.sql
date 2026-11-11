/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;

-- Export de la structure de table okovision. oko_saisons
DROP TABLE IF EXISTS `oko_saisons`;
CREATE TABLE IF NOT EXISTS `oko_saisons` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `saison` tinytext NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MYISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- Export de données de la table okovision.oko_saisons: ~1 rows (environ)
DELETE FROM `oko_saisons`;
/*!40000 ALTER TABLE `oko_saisons` DISABLE KEYS */;
INSERT INTO `oko_saisons` (`id`, `saison`, `date_debut`, `date_fin`) VALUES
	(1, '2015-2016', '2015-09-01', '2016-08-31');
/*!40000 ALTER TABLE `oko_saisons` ENABLE KEYS */;


-- Export de la structure de table okovision. oko_dateref
DROP TABLE IF EXISTS `oko_dateref`;
CREATE TABLE IF NOT EXISTS `oko_dateref` (
  `jour` date NOT NULL
) ENGINE=MYISAM DEFAULT CHARSET=utf8 COMMENT='table de reference des dates, sur 30ans a partir du 1er Septembre 2014';
/*!40000 ALTER TABLE `oko_dateref` ENABLE KEYS */;


-- Export de la structure de table okovision. oko_resume_day
DROP TABLE IF EXISTS `oko_resume_day`;
CREATE TABLE IF NOT EXISTS `oko_resume_day` (
  `jour` date NOT NULL,
  `tc_ext_max` decimal(3,1) DEFAULT NULL,
  `tc_ext_min` decimal(3,1) DEFAULT NULL,
  `conso_kg` decimal(6,2) DEFAULT NULL,
  `conso_ecs_kg` decimal(6,2) DEFAULT NULL,
  `dju` decimal(6,2) DEFAULT NULL,
  `nb_cycle` int(1) unsigned zerofill DEFAULT '0',
  PRIMARY KEY (`jour`)
) ENGINE=MYISAM DEFAULT CHARSET=utf8;

-- Export de la structure de table okovision. oko_user
DROP TABLE IF EXISTS `oko_user`;
CREATE TABLE IF NOT EXISTS `oko_user` (
  `id` int(3) NOT NULL AUTO_INCREMENT,
  `user` tinytext NOT NULL,
  `pass` tinytext NOT NULL,
  `type` tinytext NOT NULL,
  `login_boiler` TINYTEXT NULL DEFAULT NULL,
  `pass_boiler` TINYTEXT NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MYISAM AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;

insert into oko_user set user="admin", pass="97f108bdeaad841227830678c7ecec6dc541bab3" , type="admin", login_boiler='oekofen', pass_boiler='b2Vrb2Zlbg==';

-- Export de la structure de table okovision. oko_user
DROP TABLE IF EXISTS `oko_boiler`;
CREATE TABLE IF NOT EXISTS `oko_boiler` (
  `timestamp` int(11) unsigned NOT NULL,
  `description` VARCHAR(150) NOT NULL,
  `config` text NOT NULL,
  PRIMARY KEY (`timestamp`)
) ENGINE=MYISAM DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `oko_historique_full`;
CREATE TABLE IF NOT EXISTS `oko_historique_full` (
	`jour` DATE NOT NULL,
	`heure` TIME NOT NULL,
	`timestamp` int(11) unsigned NOT NULL,
	PRIMARY KEY (`jour`, `heure`)
) ENGINE=MYISAM DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `oko_graphe`;
CREATE TABLE IF NOT EXISTS `oko_graphe` (
  `id` tinyint(3) NOT NULL AUTO_INCREMENT,
  `name` tinytext NOT NULL,
  `position` tinyint(3) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=MYISAM DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `oko_capteur`;
CREATE TABLE IF NOT EXISTS `oko_capteur` (
  `id` int(3) NOT NULL AUTO_INCREMENT,
  `name` mediumtext NOT NULL,
  `position_column_csv` int(2) NOT NULL,
  `column_oko` int(2) NOT NULL,
  `original_name` mediumtext NOT NULL,
  `type` mediumtext DEFAULT NULL, /* tc_ext, tps_vis, tps_vis_pause, start_cycle */
  `boiler` TINYTEXT NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=MYISAM DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `oko_asso_capteur_graphe`;
CREATE TABLE IF NOT EXISTS `oko_asso_capteur_graphe` (
  `oko_graphe_id` tinyint(3) NOT NULL,
  `oko_capteur_id` int(3) NOT NULL,
  `position` tinyint(3) NOT NULL DEFAULT '0',
  `correction_effect` mediumtext DEFAULT NULL
) ENGINE=MYISAM DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `oko_silo_events`;
CREATE TABLE IF NOT EXISTS `oko_silo_events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_date` date NOT NULL,
  `quantity` int(5) unsigned NOT NULL COMMENT 'in kg',
  `remaining` int(6)  NOT NULL COMMENT 'in kg',
  `price` int(8) NOT NULL,
  `event_type` char(10) NOT NULL DEFAULT 'PELLET',
  PRIMARY KEY (`id`)
) ENGINE=MYISAM DEFAULT CHARSET=utf8;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
