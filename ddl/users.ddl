CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `mailaddress` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `password` text COLLATE utf8mb4_bin,
  `wheretogo` text COLLATE utf8mb4_bin,
  `go_date` date DEFAULT NULL,
  `go_time` time DEFAULT NULL,
  `back_date` date DEFAULT NULL,
  `back_time` time DEFAULT NULL,
  `active` tinyint(1) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin