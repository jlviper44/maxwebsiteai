PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE [FluentAPIs] ("Name" text PRIMARY KEY,"API_KEY" text,"AFFILIATE_ID" text);
INSERT INTO FluentAPIs VALUES('Max','hFct58Jru5Y5cPlP8VGq8Q','207744');
CREATE TABLE [Users] ("ID" integer PRIMARY KEY,"Name" text,"Username" text,"Password" text,"Permissions" text);
INSERT INTO Users VALUES(0,'Default','Admin','xzM^T1qtHR1d%T1@3hUj5P^Zhr^%FVusI','All');
