# Cobertura del motor de combate

> Generado por `node tools/battle_coverage.mjs` a partir de `game/data/*.json` y de los registros de
> `game/src/battle/core`. No editar a mano: volver a generar tras añadir efectos.

## Resumen

| Área | Implementado | Total | Cobertura |
|---|---:|---:|---:|
| Códigos de función de movimientos (moves.json) | 463 | 463 | 100.0 % |
| Movimientos aprendibles por el inventario Axis | 734 | 734 | 100.0 % |
| Habilidades (abilities.json) | 327 | 328 | 99.7 % |
| Habilidades de especies Axis | 214 | 214 | 100.0 % |
| Objetos equipados con efecto (manejadores) | 190 | — | — |
| Objetos de mochila usables en combate | 82 | 83 | 98.8 % |
| Poké Balls con modificador | 26 | 26 | 100.0 % |

Los códigos sin clase propia usan un respaldo seguro (`UnimplementedMove`): los movimientos de daño
golpean sin efecto adicional y los de estado fallan con «¡Pero ha fallado!». Los códigos usados en
combate sin implementar quedan registrados en `unimplementedUsed` (exportado por `battle/core/index.js`).

## Códigos de función pendientes

Ninguno: todos los códigos presentes en `moves.json` tienen clase.

## Habilidades pendientes

| Habilidad | Nombre | ¿Especie Axis? | Motivo |
|---|---|---|---|
| `TERASHIFT` | Teracambio | no | Depende de la teracristalización, que el motor no implementa. |

## Objetos de mochila sin efecto en combate

`CENIZASSAGRADAS` (Cenizas Sagradas)

`CENIZASSAGRADAS` tiene `battleUse` en los datos, pero Añil no le da manejador de combate (solo de campo).

## Poké Balls sin modificador propio

Ninguna (todas usan su ratio).

## Códigos implementados

| Código | Nº movimientos | Aprendibles en Axis | Ejemplos |
|---|---:|---:|---|
| `AddGhostTypeToTarget` | 1 | 0 | Halloween |
| `AddGrassTypeToTarget` | 1 | 0 | Condena Silvana |
| `AddMoneyGainedFromBattle` | 1 | 1 | Día de Pago |
| `AddMoneyGainedFromBattleLowerUserSpAtk1` | 1 | 0 | Fiebre Dorada |
| `AddSpikesToFoeSide` | 1 | 1 | Púas |
| `AddStealthRocksToFoeSide` | 1 | 1 | Trampa Rocas |
| `AddStickyWebToFoeSide` | 1 | 1 | Red Viscosa |
| `AddToxicSpikesToFoeSide` | 1 | 1 | Púas Tóxicas |
| `AllBattlersConsumeBerry` | 1 | 1 | Hora del Té |
| `AlwaysCriticalHit` | 5 | 3 | Golpe Oscuro, Llave Corsé, Vaho Gélido |
| `AttackAndSkipNextTurn` | 10 | 8 | Rayo Infinito, Distorsión, Asalto Estelar |
| `AttackTwoTurnsLater` | 2 | 2 | Premonición, Deseo Oculto |
| `AttackerFaintsIfUserFaints` | 1 | 1 | Mismo Destino |
| `AttractTarget` | 1 | 1 | Atracción |
| `BadPoisonTarget` | 3 | 2 | Colmillo Veneno, Tóxico, Cadena Virulenta |
| `BindTarget` | 9 | 8 | Acoso, Electrojaula, Lluvia Ígnea |
| `BindTargetDoublePowerIfTargetUnderwater` | 1 | 1 | Torbellino |
| `BounceBackProblemCausingStatusMoves` | 1 | 1 | Capa Mágica |
| `BurnAttackerBeforeUserActs` | 1 | 0 | Pico Cañón |
| `BurnFlinchTarget` | 1 | 1 | Colmillo Ígneo |
| `BurnTarget` | 18 | 17 | Llama Azul, Balón Ígneo, Llamarada |
| `BurnTargetAlwaysHitsInRain` | 1 | 1 | Simún de Arena |
| `BurnTargetIfTargetStatsRaisedThisTurn` | 1 | 1 | Envidia ardiente |
| `CannotBeRedirected` | 1 | 1 | Disparo Certero |
| `CannotMakeTargetFaint` | 2 | 1 | Falso Tortazo, Clemencia |
| `CantSelectConsecutiveTurns` | 2 | 1 | Martillo Colosal, Luna Roja |
| `CategoryDependsOnHigherDamageIgnoreTargetAbility` | 1 | 1 | Géiser Fotónico |
| `CategoryDependsOnHigherDamagePoisonTarget` | 1 | 0 | Moluscañón |
| `ConfuseTarget` | 13 | 13 | Rayo Señal, Cautivapor, Beso Dulce |
| `ConfuseTargetAlwaysHitsInRainHitsTargetInSky` | 1 | 1 | Vendaval |
| `ConfuseTargetIfTargetStatsRaisedThisTurn` | 1 | 1 | Canto Encantador |
| `CorrodeTargetItem` | 1 | 1 | Gas Corrosivo |
| `CounterDamagePlusHalf` | 2 | 2 | Represión Metal, Resarcimiento |
| `CounterPhysicalDamage` | 1 | 1 | Contraataque |
| `CounterSpecialDamage` | 1 | 1 | Manto Espejo |
| `CrashDamageIfFails` | 1 | 1 | Plancha Voltaica |
| `CrashDamageIfFailsConfuseTarget` | 1 | 1 | Patada Hacha |
| `CrashDamageIfFailsUnusableInGravity` | 2 | 2 | Patada Salto Alta, Patada Salto |
| `CureTargetBurn` | 1 | 0 | Aria Burbuja |
| `CureTargetStatusHealUserHalfOfTotalHP` | 1 | 1 | Purificación |
| `CureUserBurnPoisonParalysis` | 1 | 1 | Alivio |
| `CureUserPartyStatus` | 2 | 2 | Aromaterapia, Cascabel Cura |
| `CurseTargetOrLowerUserSpd1RaiseUserAtkDef1` | 1 | 1 | Maldición |
| `DamageAndCureUserPartyStatus` | 1 | 1 | Sylveotornado |
| `DamageAndResetAllBattlersStatStages` | 1 | 1 | Glaceoprisma |
| `DamageAndStartWeakenPhysicalDamageAgainstUserSide` | 1 | 1 | Umbreozona |
| `DamageAndStartWeakenSpecialDamageAgainstUserSide` | 1 | 1 | Espeaura |
| `DamageTargetAddLeechSeedToFoeSide` | 1 | 1 | Leafitobombas |
| `DamageTargetAddSpikesToFoeSide` | 1 | 0 | Tajo Metralla |
| `DamageTargetAddStealthRocksToFoeSide` | 1 | 1 | Hachazo Pétreo |
| `DamageTargetAlly` | 1 | 1 | Pirotecnia |
| `DestroyTargetBerryOrGem` | 1 | 1 | Calcinación |
| `DisableTargetHealingMoves` | 1 | 1 | Anticura |
| `DisableTargetHealingMoves2Turns` | 1 | 1 | Psicorruido |
| `DisableTargetLastMoveUsed` | 1 | 1 | Anulación |
| `DisableTargetMovesKnownByUser` | 1 | 1 | Sellar |
| `DisableTargetSoundMoves` | 1 | 1 | Golpe Mordaza |
| `DisableTargetStatusMoves` | 1 | 1 | Mofa |
| `DisableTargetUsingDifferentMove` | 1 | 1 | Otra Vez |
| `DisableTargetUsingSameMoveConsecutively` | 1 | 1 | Tormento |
| `DoesNothingCongratulations` | 1 | 0 | Celebración |
| `DoesNothingFailsIfNoAlly` | 1 | 0 | Manos Juntas |
| `DoesNothingUnusableInGravity` | 1 | 1 | Salpicadura |
| `DoubleMoneyGainedFromBattle` | 1 | 0 | Paga Extra |
| `DoublePowerAfterFusionBolt` | 1 | 1 | Llama Fusión |
| `DoublePowerAfterFusionFlare` | 1 | 1 | Rayo Fusión |
| `DoublePowerIfAllyFaintedLastTurn` | 1 | 1 | Represalia |
| `DoublePowerIfTargetActed` | 1 | 1 | Vendetta |
| `DoublePowerIfTargetAsleepCureTarget` | 1 | 1 | Espabila |
| `DoublePowerIfTargetHPLessThanHalf` | 1 | 1 | Salmuera |
| `DoublePowerIfTargetInSky` | 1 | 1 | Tornado |
| `DoublePowerIfTargetLostHPThisTurn` | 1 | 1 | Buena Baza |
| `DoublePowerIfTargetNotActed` | 2 | 1 | Electropico, Branquibocado |
| `DoublePowerIfTargetParalyzedCureTarget` | 1 | 1 | Estímulo |
| `DoublePowerIfTargetPoisoned` | 1 | 1 | Carga Tóxica |
| `DoublePowerIfTargetPoisonedPoisonTarget` | 1 | 0 | Mil Púas Tóxicas |
| `DoublePowerIfTargetStatusProblem` | 1 | 1 | Infortunio |
| `DoublePowerIfTargetStatusProblemBurnTarget` | 1 | 0 | Marcha Espectral |
| `DoublePowerIfTargetUnderground` | 1 | 1 | Terremoto |
| `DoublePowerIfTargetUnderwater` | 1 | 1 | Surf |
| `DoublePowerIfUserHasNoItem` | 1 | 1 | Acróbata |
| `DoublePowerIfUserLastMoveFailed` | 2 | 2 | Pataleta, Cólera Ardiente |
| `DoublePowerIfUserLostHPThisTurn` | 2 | 2 | Desquite, Alud |
| `DoublePowerIfUserPoisonedBurnedParalyzed` | 1 | 1 | Fachada |
| `DoublePowerIfUserStatsLoweredThisTurn` | 1 | 1 | Desahogo |
| `DoublePowerInElectricTerrain` | 1 | 1 | Alto Voltaje |
| `EffectDependsOnEnvironment` | 1 | 1 | Daño Secreto |
| `EffectivenessIncludesFlyingType` | 1 | 0 | Plancha Voladora |
| `EnsureNextCriticalHit` | 1 | 1 | Aguzar |
| `EnsureNextMoveAlwaysHits` | 2 | 2 | Fijar Blanco, Telépata |
| `FailsIfNotUserFirstTurn` | 1 | 0 | Escaramuza |
| `FailsIfTargetActed` | 2 | 1 | Golpe Bajo, Relámpago Súbito |
| `FailsIfTargetHasNoItem` | 1 | 1 | Poltergeist |
| `FailsIfUserDamagedThisTurn` | 1 | 1 | Puño Certero |
| `FailsIfUserHasUnusedMove` | 1 | 1 | Última Baza |
| `FailsIfUserNotConsumedBerry` | 1 | 1 | Eructo |
| `FailsUnlessTargetSharesTypeWithUser` | 1 | 1 | Sincrorruido |
| `FirePledge` | 1 | 1 | Voto Fuego |
| `FixedDamage20` | 1 | 1 | Bomba Sónica |
| `FixedDamage40` | 1 | 1 | Furia Dragón |
| `FixedDamageHalfTargetHP` | 3 | 1 | Furia Natural, Superdiente, Calamidad |
| `FixedDamageUserLevel` | 2 | 2 | Sísmico, Tinieblas |
| `FixedDamageUserLevelRandom` | 1 | 1 | Psicoonda |
| `FlinchTarget` | 23 | 21 | Rodillo de Púas, Furia Candente, Pulso Umbrío |
| `FlinchTargetDoublePowerIfTargetInSky` | 1 | 1 | Ciclón |
| `FlinchTargetFailsIfNotUserFirstTurn` | 1 | 1 | Sorpresa |
| `FlinchTargetFailsIfTargetNotUsingPriorityMove` | 1 | 1 | Palma Rauda |
| `FlinchTargetFailsIfUserNotAsleep` | 1 | 1 | Ronquido |
| `FreezeFlinchTarget` | 1 | 1 | Colmillo Hielo |
| `FreezeTarget` | 5 | 5 | Rayo Hielo, Puño Hielo, Nieve Polvo |
| `FreezeTargetAlwaysHitsInHail` | 1 | 1 | Ventisca |
| `FreezeTargetSuperEffectiveAgainstWater` | 1 | 1 | Liofilización |
| `GiveUserStatusToTarget` | 1 | 1 | Psicocambio |
| `GrassPledge` | 1 | 1 | Voto Planta |
| `HealAllyOrDamageFoe` | 1 | 1 | Bola de Polen |
| `HealTargetDependingOnGrassyTerrain` | 1 | 1 | Cura Floral |
| `HealTargetHalfOfTotalHP` | 1 | 1 | Pulso Cura |
| `HealUserAndAlliesQuarterOfTotalHP` | 1 | 1 | Gota Vital |
| `HealUserAndAlliesQuarterOfTotalHPCureStatus` | 2 | 1 | Cura Selvática, Plegaria Lunar |
| `HealUserByHalfOfDamageDone` | 9 | 9 | Chupavidas, Carga Parábola, Puño Drenaje |
| `HealUserByHalfOfDamageDoneBurnTarget` | 1 | 0 | Cañón Batidor |
| `HealUserByHalfOfDamageDoneIfTargetAsleep` | 1 | 1 | Comesueños |
| `HealUserByTargetAttackLowerTargetAttack1` | 1 | 1 | Absorbefuerza |
| `HealUserByThreeQuartersOfDamageDone` | 2 | 2 | Beso Drenaje, Ala Mortífera |
| `HealUserDependingOnSandstorm` | 1 | 0 | Recogearena |
| `HealUserDependingOnUserStockpile` | 1 | 1 | Tragar |
| `HealUserDependingOnWeather` | 3 | 3 | Luz Lunar, Fotosíntesis, Sol Matinal |
| `HealUserFullyAndFallAsleep` | 1 | 1 | Descanso |
| `HealUserHalfOfTotalHP` | 5 | 4 | Auxilio, Batido, Recuperación |
| `HealUserHalfOfTotalHPLoseFlyingTypeThisTurn` | 1 | 1 | Respiro |
| `HealUserPositionNextTurn` | 1 | 1 | Deseo |
| `HigherPriorityInGrassyTerrain` | 1 | 1 | Fitoimpulso |
| `HigherPriorityInMistyTerrain` | 1 | 1 | Bruma Explosiva |
| `HitOncePerUserTeamMember` | 1 | 1 | Paliza |
| `HitTenTimes` | 1 | 0 | Proliferación |
| `HitThreeTimes` | 1 | 1 | Triple Inmersión |
| `HitThreeTimesAlwaysCriticalHit` | 1 | 0 | Azote Torrencial |
| `HitThreeTimesPowersUpWithEachHit` | 2 | 2 | Triple Patada, Triple Axel |
| `HitThreeTimesPowersUpWithEachHitFlinchTarget` | 1 | 0 | Triple Golpe |
| `HitTwoTimes` | 8 | 5 | Golpe Bis, Doble Patada, Ala Bis |
| `HitTwoTimesFlinchTarget` | 1 | 0 | Ferropuño Doble |
| `HitTwoTimesPoisonTarget` | 1 | 1 | Doble Ataque |
| `HitTwoTimesTargetThenTargetAlly` | 1 | 1 | Dracoflechas |
| `HitTwoToFiveTimes` | 13 | 12 | Pin Misil, Empujón, Semilladora |
| `HitTwoToFiveTimesOrThreeForAshGreninja` | 1 | 0 | Shuriken de Agua |
| `HitTwoToFiveTimesRaiseUserSpd1LowerUserDef1` | 1 | 1 | Ráfaga Escamas |
| `HitsAllFoesAndPowersUpInPsychicTerrain` | 1 | 1 | Vasta Fuerza |
| `HitsFairysIgnoreTargetDefSpDefEvaStatStages` | 1 | 0 | Luz Devastadora |
| `HitsTargetInSky` | 1 | 1 | Gancho Alto |
| `HitsTargetInSkyGroundsTarget` | 2 | 2 | Mil Flechas, Antiaéreo |
| `HoopaRemoveProtectionsBypassSubstituteLowerUserDef1` | 1 | 1 | Cerco Dimensión |
| `IgnoreTargetAbility` | 2 | 2 | Rayo Umbrío, Meteoimpacto |
| `IgnoreTargetDefSpDefEvaStatStages` | 3 | 3 | Lariat Oscuro, Espada Santa, Guardia Baja |
| `IncreasePowerEachFaintedAlly` | 1 | 0 | Homenaje Póstumo |
| `IncreasePowerEachTimeHit` | 1 | 0 | Puño Furia |
| `IncreasePowerInElectricTerrain` | 1 | 0 | Psicohojas |
| `IncreasePowerInSunWeather` | 1 | 0 | Hidrovapor |
| `IncreasePowerSuperEffective` | 2 | 0 | Nitrochoque, Electroderrape |
| `InvertTargetStatStages` | 1 | 0 | Reversión |
| `LowerPPOfTargetLastMoveBy3` | 1 | 0 | Conjuro Funesto |
| `LowerPPOfTargetLastMoveBy4` | 1 | 1 | Rencor |
| `LowerPoisonedTargetAtkSpAtkSpd1` | 1 | 1 | Trampa Venenosa |
| `LowerTargetAccuracy1` | 11 | 11 | Pulso Noche, Ciclón de Hojas, Bomba Fango |
| `LowerTargetAtkDef1` | 1 | 1 | Cosquillas |
| `LowerTargetAtkSpAtk1` | 2 | 2 | Rugido de Guerra, Ojos Llorosos |
| `LowerTargetAtkSpAtk1SwitchOutUser` | 1 | 1 | Última Palabra |
| `LowerTargetAttack1` | 10 | 9 | Plancha, Vasto Impacto, Carantoña |
| `LowerTargetAttack1BypassSubstitute` | 1 | 1 | Camaradería |
| `LowerTargetAttack2` | 2 | 2 | Encanto, Danza Pluma |
| `LowerTargetDefense1` | 11 | 9 | Triturar, Patada Relámpago, Golpe Roca |
| `LowerTargetDefense1FlinchTarget` | 1 | 0 | Triple Flecha |
| `LowerTargetDefense1PowersUpInGravity` | 1 | 1 | Fuerza G |
| `LowerTargetDefense2` | 1 | 1 | Chirrido |
| `LowerTargetEvasion1RemoveSideEffects` | 1 | 1 | Despejar |
| `LowerTargetEvasion2` | 1 | 1 | Dulce Aroma |
| `LowerTargetHPToUserHP` | 1 | 1 | Esfuerzo |
| `LowerTargetSpAtk1` | 8 | 7 | Golpe Rastrero, Estoicismo, Alarido |
| `LowerTargetSpAtk2` | 1 | 1 | Onda Anómala |
| `LowerTargetSpAtk2IfCanAttract` | 1 | 1 | Seducción |
| `LowerTargetSpDef1` | 10 | 9 | Zumbido, Onda Certera, Bola Sombra |
| `LowerTargetSpDef2` | 5 | 4 | Llanto Falso, Fulgor Semilla, Bomba Ácida |
| `LowerTargetSpeed1` | 11 | 10 | Electrotela, Puntapié, Batería Asalto |
| `LowerTargetSpeed1AlwaysHitsInRain` | 1 | 1 | Vendaval Gélido |
| `LowerTargetSpeed1MakeTargetWeakerToFire` | 1 | 0 | Alquitranazo |
| `LowerTargetSpeed1WeakerInGrassyTerrain` | 1 | 1 | Terratemblor |
| `LowerTargetSpeed2` | 3 | 3 | Disparo Demora, Esporagodón, Cara Susto |
| `LowerTargetSpeedOverTime` | 1 | 1 | Bomba Caramelo |
| `LowerUserAtkDef1` | 1 | 1 | Fuerza Bruta |
| `LowerUserDefSpDef1` | 4 | 4 | A Bocajarro, Ascenso Draco, Arremetida |
| `LowerUserDefSpDef1RaiseUserAtkSpAtkSpd2` | 1 | 1 | Rompecoraza |
| `LowerUserDefSpDefSpd1` | 1 | 1 | V de Fuego |
| `LowerUserDefense1` | 1 | 1 | Fragor Escamas |
| `LowerUserSpAtk2` | 5 | 5 | Cometa Draco, Cañón Floral, Sofoco |
| `LowerUserSpeed1` | 2 | 2 | Machada, Martillo Hielo |
| `LowerUserSpeed2` | 1 | 1 | Quemarrueda |
| `MaxUserAttackLoseHalfOfTotalHP` | 1 | 1 | Tambor |
| `MultiTurnAttackBideThenReturnDoubleDamage` | 1 | 1 | Venganza |
| `MultiTurnAttackConfuseUserAtEnd` | 4 | 4 | Enfado, Danza Pétalo, Saña |
| `MultiTurnAttackPowersUpEachTurn` | 2 | 2 | Bola Hielo, Rodar |
| `MultiTurnAttackPreventSleeping` | 1 | 1 | Alboroto |
| `NegateTargetAbility` | 1 | 1 | Bilis |
| `NegateTargetAbilityIfTargetActed` | 1 | 1 | Núcleo Castigo |
| `None` | 88 | 78 | Megacuerno, Al Ataque, Tijera X |
| `NormalMovesBecomeElectric` | 2 | 1 | Puños Plasma, Cortina Plasma |
| `OHKO` | 2 | 2 | Guillotina, Perforador |
| `OHKOHitsUndergroundTarget` | 1 | 1 | Fisura |
| `OHKOIce` | 1 | 1 | Frío Polar |
| `ParalyzeBurnOrFreezeTarget` | 1 | 1 | Triataque |
| `ParalyzeFlinchTarget` | 1 | 1 | Colmillo Rayo |
| `ParalyzeTarget` | 16 | 16 | Dragoaliento, Ataque Fulgor, Electrocañón |
| `ParalyzeTargetAlwaysHitsInRain` | 1 | 1 | Electormenta |
| `ParalyzeTargetAlwaysHitsInRainHitsDecreasesInSunTargetInSky` | 1 | 1 | Trueno |
| `ParalyzeTargetIfNotTypeImmune` | 1 | 1 | Onda Trueno |
| `PoisonParalyzeOrSleepTarget` | 1 | 0 | Garra Nociva |
| `PoisonTarget` | 11 | 11 | Lanzamugre, Onda Tóxica, Bomba Lodo |
| `PoisonTargetLowerTargetSpeed1` | 1 | 0 | Hilo Venenoso |
| `PowerDependsOnUserStockpile` | 1 | 1 | Escupir |
| `PowerHigherWithConsecutiveUse` | 1 | 1 | Corte Furia |
| `PowerHigherWithConsecutiveUseOnUserSide` | 1 | 1 | Eco Voz |
| `PowerHigherWithLessPP` | 1 | 1 | As Oculto |
| `PowerHigherWithTargetFasterThanUser` | 1 | 1 | Giro Bola |
| `PowerHigherWithTargetHP` | 2 | 2 | Agarrón, Estrujón |
| `PowerHigherWithTargetHP100PowerRange` | 1 | 1 | Prensa Metálica |
| `PowerHigherWithTargetPositiveStatStages` | 1 | 1 | Castigo |
| `PowerHigherWithTargetWeight` | 2 | 2 | Patada Baja, Hierba Lazo |
| `PowerHigherWithUserFasterThanTarget` | 1 | 1 | Bola Voltio |
| `PowerHigherWithUserHP` | 3 | 2 | Dracoenergía, Estallido, Salpicar |
| `PowerHigherWithUserHappiness` | 3 | 3 | Retribución, Eevimpacto, Pikatormenta |
| `PowerHigherWithUserHeavierThanTarget` | 2 | 2 | Golpe Calor, Cuerpo Pesado |
| `PowerHigherWithUserPositiveStatStages` | 2 | 2 | Chulería, Poder Reserva |
| `PowerLowerWithUserHP` | 2 | 2 | Inversión, Azote |
| `PowerLowerWithUserHappiness` | 1 | 1 | Frustración |
| `PowerUpAllyMove` | 1 | 1 | Refuerzo |
| `ProtectUser` | 2 | 2 | Detección, Protección |
| `ProtectUserBanefulBunker` | 1 | 0 | Búnker |
| `ProtectUserBurningBulwark` | 1 | 0 | Llama Protectora |
| `ProtectUserFromDamagingMovesKingsShield` | 1 | 1 | Escudo Real |
| `ProtectUserFromDamagingMovesObstruct` | 1 | 0 | Obstrucción |
| `ProtectUserFromDamagingMovesSilkTrap` | 1 | 0 | Telatrampa |
| `ProtectUserFromTargetingMovesSpikyShield` | 1 | 1 | Barrera Espinosa |
| `ProtectUserSideFromDamagingMovesIfUserFirstTurn` | 1 | 0 | Escudo Tatami |
| `ProtectUserSideFromMultiTargetDamagingMoves` | 1 | 1 | Vasta Guardia |
| `ProtectUserSideFromPriorityMoves` | 1 | 1 | Anticipo |
| `ProtectUserSideFromStatusMoves` | 1 | 1 | Truco Defensa |
| `PursueSwitchingFoe` | 1 | 1 | Persecución |
| `RaiseAlliesAtkDef1` | 1 | 1 | Motivación |
| `RaiseAlliesCriticalHitRate1DragonTypes2` | 1 | 1 | Bramido Dragón |
| `RaiseGrassBattlersDef1` | 1 | 1 | Defensa Floral |
| `RaiseGroundedGrassBattlersAtkSpAtk1` | 1 | 0 | Fertilizante |
| `RaisePlusMinusUserAndAlliesAtkSpAtk1` | 1 | 1 | Piñón Auxiliar |
| `RaisePlusMinusUserAndAlliesDefSpDef1` | 1 | 1 | Aura Magnética |
| `RaiseTargetAtkLowerTargetDef2` | 1 | 0 | Extracto Picante |
| `RaiseTargetAtkSpAtk2` | 1 | 1 | Decoración |
| `RaiseTargetAttack1` | 1 | 1 | Aullido |
| `RaiseTargetAttack2ConfuseTarget` | 1 | 1 | Fanfarronear |
| `RaiseTargetRandomStat2` | 1 | 1 | Acupresión |
| `RaiseTargetSpAtk1ConfuseTarget` | 1 | 1 | Camelo |
| `RaiseTargetSpDef1` | 1 | 1 | Niebla Aromática |
| `RaiseUserAtk1Spd2` | 1 | 1 | Cambio de Marcha |
| `RaiseUserAtkAcc1` | 1 | 1 | Afilagarras |
| `RaiseUserAtkDef1` | 1 | 1 | Corpulencia |
| `RaiseUserAtkDefAcc1` | 1 | 1 | Enrosque |
| `RaiseUserAtkDefSpd1` | 1 | 0 | Danza Triunfal |
| `RaiseUserAtkSpAtk1` | 1 | 1 | Avivar |
| `RaiseUserAtkSpAtk1Or2InSun` | 1 | 1 | Desarrollo |
| `RaiseUserAtkSpAtkSpeed2LoseHalfOfTotalHP` | 1 | 0 | Deslome |
| `RaiseUserAtkSpd1` | 1 | 1 | Danza Dragón |
| `RaiseUserAtkSpd1RemoveHazardsSubstitutes` | 1 | 0 | Limpieza General |
| `RaiseUserAttack1` | 5 | 5 | Puño Incremento, Afilar, Meditación |
| `RaiseUserAttack2` | 1 | 1 | Danza Espada |
| `RaiseUserAttack3IfTargetFaints` | 1 | 1 | Aguijón Letal |
| `RaiseUserCriticalHitRate2` | 1 | 1 | Foco Energía |
| `RaiseUserDefSpDef1` | 2 | 2 | A Defender, Masa Cósmica |
| `RaiseUserDefense1` | 4 | 3 | Fortaleza, Ala de Acero, Refugio |
| `RaiseUserDefense1CurlUpUser` | 1 | 1 | Rizo Defensa |
| `RaiseUserDefense2` | 5 | 5 | Armadura Ácida, Barrera, Torm. de Diamantes |
| `RaiseUserDefense3` | 1 | 1 | Rizo Algodón |
| `RaiseUserEvasion1` | 1 | 1 | Doble Equipo |
| `RaiseUserEvasion2MinimizeUser` | 1 | 1 | Reducción |
| `RaiseUserMainStats1` | 3 | 3 | Viento Plata, Viento Aciago, Poder Pasado |
| `RaiseUserMainStats1LoseThirdOfTotalHP` | 1 | 1 | Estruendo Escama |
| `RaiseUserMainStats1TrapUserInBattle` | 1 | 0 | Bastión Final |
| `RaiseUserSpAtk1` | 4 | 3 | Rayo Carga, Danza Llama, Poder Místico |
| `RaiseUserSpAtk2` | 1 | 1 | Maquinación |
| `RaiseUserSpAtk3` | 1 | 1 | Luminicola |
| `RaiseUserSpAtkSpDef1` | 1 | 1 | Paz Mental |
| `RaiseUserSpAtkSpDef1CureStatus` | 1 | 1 | Bálsamo Osado |
| `RaiseUserSpAtkSpDefSpd1` | 1 | 1 | Danza Aleteo |
| `RaiseUserSpDef1PowerUpElectricMove` | 1 | 1 | Carga |
| `RaiseUserSpDef2` | 1 | 1 | Amnesia |
| `RaiseUserSpeed1` | 5 | 5 | Nitrocarga, Ala Aural, Danza Acuática |
| `RaiseUserSpeed2` | 2 | 2 | Agilidad, Pulimento |
| `RaiseUserSpeed2LowerUserWeight` | 1 | 1 | Aligerar |
| `RaiseUserStat1Commander` | 1 | 1 | Oído Cocina |
| `RandomPowerDoublePowerIfTargetUnderground` | 1 | 1 | Magnitud |
| `RandomlyDamageOrHealTarget` | 1 | 1 | Presente |
| `RandomlyDealsDoubleDamage` | 1 | 1 | Láser Veleidoso |
| `RecoilHalfOfDamageDealt` | 2 | 1 | Luz Aniquiladora, Testarazo |
| `RecoilHalfOfTotalHP` | 1 | 1 | Clorofiláser |
| `RecoilQuarterOfDamageDealt` | 4 | 3 | Voltio Cruel, Sumisión, Ariete |
| `RecoilThirdOfDamageDealt` | 4 | 4 | Pájaro Osado, Mazazo, Doble Filo |
| `RecoilThirdOfDamageDealtBurnTarget` | 1 | 1 | Envite Ígneo |
| `RecoilThirdOfDamageDealtParalyzeTarget` | 1 | 1 | Placaje Eléctrico |
| `RedirectAllMovesToTarget` | 1 | 0 | Foco |
| `RedirectAllMovesToUser` | 2 | 2 | Polvo Ira, Señuelo |
| `RemoveProtections` | 1 | 1 | Amago |
| `RemoveProtectionsBypassSubstitute` | 1 | 1 | Paso Dimensional |
| `RemoveScreens` | 2 | 2 | Demolición, Psicocolmillo |
| `RemoveTargetItem` | 1 | 1 | Desarme |
| `RemoveTerrain` | 1 | 1 | Allanador Férreo |
| `RemoveTerrainIceSpinner` | 1 | 1 | Pirueta Helada |
| `RemoveUserBindingAndEntryHazards` | 1 | 1 | Giro Rápido |
| `RemoveUserBindingAndEntryHazardsPoisonTarget` | 1 | 0 | Giro Mortífero |
| `ReplaceMoveThisBattleWithTargetLastMoveUsed` | 1 | 1 | Mimético |
| `ReplaceMoveWithTargetLastMoveUsed` | 1 | 0 | Esquema |
| `ResetAllBattlersStatStages` | 1 | 1 | Niebla |
| `ResetTargetStatStages` | 1 | 1 | Niebla Clara |
| `RestoreUserConsumedItem` | 1 | 1 | Reciclaje |
| `RevivePokemonHalfHP` | 1 | 1 | Plegaria Vital |
| `SetAttackerMovePPTo0IfUserFaints` | 1 | 1 | Rabia |
| `SetTargetAbilityToInsomnia` | 1 | 1 | Abatidoras |
| `SetTargetAbilityToSimple` | 1 | 1 | Onda Simple |
| `SetTargetAbilityToUserAbility` | 1 | 1 | Danza Amiga |
| `SetTargetTypesToPsychic` | 1 | 1 | Polvo Mágico |
| `SetTargetTypesToWater` | 1 | 1 | Empapar |
| `SetUserAbilityToTargetAbility` | 1 | 1 | Imitación |
| `SetUserAlliesAbilityToTargetAbility` | 1 | 0 | Decalcomanía |
| `SetUserTypesBasedOnEnvironment` | 1 | 1 | Camuflaje |
| `SetUserTypesToResistLastAttack` | 1 | 1 | Conversión2 |
| `SetUserTypesToTargetTypes` | 1 | 1 | Clonatipo |
| `SetUserTypesToUserMoveType` | 1 | 1 | Conversión |
| `SleepTarget` | 7 | 7 | Brecha Negra, Silbato, Somnífero |
| `SleepTargetChangeUserMeloettaForm` | 1 | 1 | Canto Arcaico |
| `SleepTargetNextTurn` | 1 | 1 | Bostezo |
| `StarmobileBurnTarget` | 1 | 0 | Pirochoque |
| `StarmobileConfuseTarget` | 1 | 0 | Feerichoque |
| `StarmobileParalyzeTarget` | 1 | 0 | Pugnachoque |
| `StarmobilePoisonTarget` | 1 | 0 | Ponzochoque |
| `StarmobileSleepTarget` | 1 | 0 | Ominochoque |
| `StartDamageTargetEachTurnIfTargetAsleep` | 1 | 1 | Pesadilla |
| `StartElectricTerrain` | 1 | 1 | Campo Eléctrico |
| `StartGrassyTerrain` | 1 | 1 | Campo de Hierba |
| `StartGravity` | 1 | 1 | Gravedad |
| `StartHailWeather` | 2 | 2 | Granizo, Paisaje Nevado |
| `StartHealUserEachTurn` | 1 | 1 | Acua Aro |
| `StartHealUserEachTurnTrapUserInBattle` | 1 | 1 | Arraigo |
| `StartLeechSeedTarget` | 1 | 1 | Drenadoras |
| `StartMistyTerrain` | 1 | 1 | Campo de Niebla |
| `StartNegateHeldItems` | 1 | 1 | Zona Mágica |
| `StartNegateTargetEvasionStatStageAndDarkImmunity` | 1 | 1 | Gran Ojo |
| `StartNegateTargetEvasionStatStageAndGhostImmunity` | 2 | 2 | Profecía, Rastreo |
| `StartPerishCountsForAllBattlers` | 1 | 1 | Canto Mortal |
| `StartPreventCriticalHitsAgainstUserSide` | 1 | 1 | Conjuro |
| `StartPsychicTerrain` | 1 | 1 | Campo Psíquico |
| `StartRainWeather` | 1 | 1 | Danza Lluvia |
| `StartRaiseUserAtk1WhenDamaged` | 1 | 1 | Furia |
| `StartSaltCureTarget` | 1 | 1 | Salazón |
| `StartSandstormWeather` | 1 | 1 | Tormenta Arena |
| `StartSlowerBattlersActFirst` | 1 | 1 | Espacio Raro |
| `StartSunWeather` | 1 | 1 | Día Soleado |
| `StartSwapAllBattlersBaseDefensiveStats` | 1 | 1 | Zona Extraña |
| `StartTargetAirborneAndAlwaysHitByMoves` | 1 | 1 | Telequinesis |
| `StartTargetCannotUseItem` | 1 | 1 | Embargo |
| `StartUserAirborne` | 1 | 1 | Levitón |
| `StartUserSideDoubleSpeed` | 1 | 1 | Viento Afín |
| `StartUserSideImmunityToInflictedStatus` | 1 | 1 | Velo Sagrado |
| `StartUserSideImmunityToStatStageLowering` | 1 | 1 | Neblina |
| `StartWeakenDamageAgainstUserSideIfHail` | 1 | 1 | Velo Aurora |
| `StartWeakenElectricMoves` | 1 | 1 | Chapoteo Lodo |
| `StartWeakenFireMoves` | 1 | 1 | Hidrochorro |
| `StartWeakenPhysicalDamageAgainstUserSide` | 1 | 1 | Reflejo |
| `StartWeakenSpecialDamageAgainstUserSide` | 1 | 1 | Pantalla de Luz |
| `StealAndUseBeneficialStatusMove` | 1 | 1 | Robo |
| `SuperEffectiveAgainstBug` | 1 | 1 | Atrapabicho |
| `SwapSideEffects` | 1 | 0 | Cambio de Cancha |
| `SwitchOutTargetDamagingMove` | 2 | 2 | Cola Dragón, Llave Giro |
| `SwitchOutTargetStatusMove` | 2 | 2 | Rugido, Remolino |
| `SwitchOutUserDamagingMove` | 3 | 3 | Ida y Vuelta, Voltiocambio, Viraje |
| `SwitchOutUserPassOnEffects` | 1 | 1 | Relevo |
| `SwitchOutUserStartHailWeather` | 1 | 0 | Fría Acogida |
| `SwitchOutUserStatusMove` | 1 | 1 | Teletransporte |
| `TargetActsLast` | 1 | 1 | Último Lugar |
| `TargetActsNext` | 1 | 1 | Cede Paso |
| `TargetMovesBecomeElectric` | 1 | 0 | Electrificación |
| `TargetNextFireMoveDamagesTarget` | 1 | 0 | Polvo Explosivo |
| `TargetTakesUserItem` | 1 | 1 | Ofrenda |
| `TargetUsesItsLastUsedMoveAgain` | 1 | 0 | Mandato |
| `TerapagosCategoryDependsOnHigherDamage` | 1 | 0 | Teraclúster |
| `ThrowUserItemAtTarget` | 1 | 1 | Lanzamiento |
| `TransformUserIntoTarget` | 1 | 1 | Transformación |
| `TrapAllBattlersInBattleForOneTurn` | 1 | 0 | Cerrojo Feérico |
| `TrapTargetInBattle` | 5 | 2 | Telaraña, Puntada Sombría, Bloqueo |
| `TrapTargetInBattleLowerTargetDefSpDef1EachTurn` | 1 | 0 | Octopresa |
| `TrapTargetInBattleMainEffect` | 1 | 1 | Mil Temblores |
| `TrapUserAndTargetInBattle` | 1 | 0 | Presa Maxilar |
| `TwoTurnAttackBurnTarget` | 1 | 1 | Llama Gélida |
| `TwoTurnAttackChargeRaiseUserDefense1` | 1 | 1 | Cabezazo |
| `TwoTurnAttackChargeRaiseUserSpAtk1` | 1 | 1 | Rayo Meteórico |
| `TwoTurnAttackFlinchTarget` | 1 | 1 | Ataque Aéreo |
| `TwoTurnAttackInvulnerableInSky` | 1 | 1 | Vuelo |
| `TwoTurnAttackInvulnerableInSkyParalyzeTarget` | 1 | 1 | Bote |
| `TwoTurnAttackInvulnerableInSkyTargetCannotAct` | 1 | 1 | Caída Libre |
| `TwoTurnAttackInvulnerableRemoveProtections` | 2 | 2 | Golpe Umbrío, Golpe Fantasma |
| `TwoTurnAttackInvulnerableUnderground` | 1 | 1 | Excavar |
| `TwoTurnAttackInvulnerableUnderwater` | 1 | 1 | Buceo |
| `TwoTurnAttackOneTurnInRainRaiseUserSpAtk1` | 1 | 1 | Electrorrayo |
| `TwoTurnAttackOneTurnInSun` | 2 | 2 | Cuchilla Solar, Rayo Solar |
| `TwoTurnAttackParalyzeTarget` | 1 | 1 | Rayo Gélido |
| `TwoTurnAttackRaiseUserSpAtkSpDefSpd2` | 1 | 1 | Geocontrol |
| `TypeAndPowerDependOnTerrain` | 1 | 1 | Pulso de Campo |
| `TypeAndPowerDependOnUserBerry` | 1 | 1 | Don Natural |
| `TypeAndPowerDependOnWeather` | 1 | 1 | Meteorobola |
| `TypeDependsOnUserDrive` | 1 | 0 | Tecno Shock |
| `TypeDependsOnUserIVs` | 1 | 1 | Poder Oculto |
| `TypeDependsOnUserMemory` | 1 | 0 | Multiataque |
| `TypeDependsOnUserMorpekoFormRaiseUserSpeed1` | 1 | 0 | Rueda Aural |
| `TypeDependsOnUserPlate` | 1 | 1 | Sentencia |
| `TypeIsUserFirstType` | 1 | 1 | Danza Despertar |
| `TypeIsUserSecondType` | 1 | 0 | Garrote Liana |
| `TypeIsUserSecondTypeRemoveScreens` | 1 | 1 | Furia Taurina |
| `UseLastMoveUsed` | 1 | 1 | Copión |
| `UseLastMoveUsedByTarget` | 1 | 1 | Espejo |
| `UseMoveDependingOnEnvironment` | 1 | 1 | Adaptación |
| `UseMoveTargetIsAboutToUse` | 1 | 1 | Yo Primero |
| `UseRandomMove` | 1 | 1 | Metrónomo |
| `UseRandomMoveFromUserParty` | 1 | 1 | Ayuda |
| `UseRandomUserMoveIfAsleep` | 1 | 1 | Sonámbulo |
| `UseTargetAttackInsteadOfUserAttack` | 1 | 1 | Juego Sucio |
| `UseTargetDefenseInsteadOfTargetSpDef` | 3 | 3 | Sable Místico, Onda Mental, Psicocarga |
| `UseUserDefenseInsteadOfUserAttack` | 1 | 1 | Plancha Corporal |
| `UsedAfterAllyRoundWithDoublePower` | 1 | 1 | Canon |
| `UsedAfterUserTakesPhysicalDamage` | 1 | 0 | Coraza Trampa |
| `UserAddStockpileRaiseDefSpDef1` | 1 | 1 | Reserva |
| `UserConsumeBerryRaiseDefense2` | 1 | 0 | Atiborramiento |
| `UserConsumeTargetBerry` | 2 | 2 | Picadura, Picoteo |
| `UserCopyTargetStatStages` | 1 | 1 | Autosugestión |
| `UserEnduresFaintingThisTurn` | 1 | 1 | Aguante |
| `UserFaintsExplosive` | 2 | 2 | Explosion, Autodestrucción |
| `UserFaintsFixedDamageUserHP` | 1 | 1 | Sacrificio |
| `UserFaintsHealAndCureReplacement` | 1 | 1 | Deseo Cura |
| `UserFaintsHealAndCureReplacementRestorePP` | 1 | 1 | Danza Lunar |
| `UserFaintsLowerTargetAtkSpAtk2` | 1 | 1 | Legado |
| `UserLosesElectricType` | 1 | 1 | Electropalmas |
| `UserLosesFireType` | 1 | 1 | Llama Final |
| `UserLosesHalfOfTotalHP` | 1 | 1 | Metaláser |
| `UserLosesHalfOfTotalHPExplosive` | 1 | 1 | Cabeza Sorpresa |
| `UserMakeSubstitute` | 1 | 1 | Sustituto |
| `UserMakeSubstituteSwitchOut` | 1 | 1 | Autotomía |
| `UserStealTargetPositiveStatStages` | 1 | 1 | Robasombra |
| `UserSwapBaseAtkDef` | 2 | 1 | Truco Fuerza, Cambiapoder |
| `UserSwapsPositionsWithAlly` | 1 | 1 | Cambio de Banda |
| `UserTakesTargetItem` | 2 | 2 | Ladrón, Antojo |
| `UserTargetAverageBaseAtkSpAtk` | 1 | 1 | Isofuerza |
| `UserTargetAverageBaseDefSpDef` | 1 | 1 | Isoguardia |
| `UserTargetAverageHP` | 1 | 1 | Divide Dolor |
| `UserTargetSwapAbilities` | 1 | 1 | Intercambio |
| `UserTargetSwapAtkSpAtkStages` | 1 | 1 | Cambiafuerza |
| `UserTargetSwapBaseSpeed` | 1 | 1 | Cambiavelocidad |
| `UserTargetSwapDefSpDefStages` | 1 | 1 | Cambiadefensa |
| `UserTargetSwapItems` | 2 | 2 | Trapicheo, Truco |
| `UserTargetSwapStatStages` | 1 | 1 | Cambiaalmas |
| `UserVulnerableUntilNextAction` | 1 | 1 | Asalto Espadón |
| `WaterPledge` | 1 | 1 | Voto Agua |

## Objetos equipados con manejador

`ABSORBBULB`, `ADAMANTORB`, `ADRENALINEORB`, `AGUAVBERRY`, `AIRBALLOON`, `APICOTBERRY`, `ASPEARBERRY`, `ASSAULTVEST`, `BABIRIBERRY`, `BERRYJUICE`, `BLACKBELT`, `BLACKGLASSES`, `BLACKSLUDGE`, `BLANKPLATE`, `BLUNDERPOLICY`, `BRIGHTPOWDER`, `BUGGEM`, `CELLBATTERY`, `CHARCOAL`, `CHARTIBERRY`, `CHERIBERRY`, `CHESTOBERRY`, `CHILANBERRY`, `CHOICEBAND`, `CHOICESCARF`, `CHOICESPECS`, `CHOPLEBERRY`, `CLEARAMULET`, `COBABERRY`, `COLBURBERRY`, `CORNERSTONEMASK`, `CUSTAPBERRY`, `DAMPROCK`, `DARKGEM`, `DEEPSEASCALE`, `DEEPSEATOOTH`, `DRACOPLATE`, `DRAGONFANG`, `DRAGONGEM`, `DREADPLATE`, `EARTHPLATE`, `EJECTBUTTON`, `EJECTPACK`, `ELECTRICGEM`, `ELECTRICSEED`, `ENIGMABERRY`, `EVIOLITE`, `EXPERTBELT`, `FAIRYFEATHER`, `FAIRYGEM`, `FIGHTINGGEM`, `FIGYBERRY`, `FIREGEM`, `FISTPLATE`, `FLAMEORB`, `FLAMEPLATE`, `FLOATSTONE`, `FLYINGGEM`, `FULLINCENSE`, `GANLONBERRY`, `GHOSTGEM`, `GRASSGEM`, `GRASSYSEED`, `GRISEOUSORB`, `GROUNDGEM`, `HABANBERRY`, `HARDSTONE`, `HEARTHFLAMEMASK`, `HEATROCK`, `HOPOBERRY`, `IAPAPABERRY`, `ICEGEM`, `ICICLEPLATE`, `ICYROCK`, `INSECTPLATE`, `IRONBALL`, `IRONPLATE`, `JABOCABERRY`, `KASIBBERRY`, `KEBIABERRY`, `KEEBERRY`, `LAGGINGTAIL`, `LANSATBERRY`, `LAXINCENSE`, `LEEK`, `LEFTOVERS`, `LEPPABERRY`, `LIECHIBERRY`, `LIFEORB`, `LIGHTBALL`, `LUCKYEGG`, `LUCKYPUNCH`, `LUMBERRY`, `LUMINOUSMOSS`, `LUSTROUSORB`, `MACHOBRACE`, `MAGNET`, `MAGOBERRY`, `MARANGABERRY`, `MEADOWPLATE`, `MENTALHERB`, `METALCOAT`, `METALPOWDER`, `METRONOME`, `MICLEBERRY`, `MINDPLATE`, `MIRACLESEED`, `MIRRORHERB`, `MISTYSEED`, `MUSCLEBAND`, `MYSTICWATER`, `NEVERMELTICE`, `NORMALGEM`, `OCCABERRY`, `ODDINCENSE`, `ORANBERRY`, `PASSHOBERRY`, `PAYAPABERRY`, `PECHABERRY`, `PERSIMBERRY`, `PETAYABERRY`, `PIXIEPLATE`, `POISONBARB`, `POISONGEM`, `POWERANKLET`, `POWERBAND`, `POWERBELT`, `POWERBRACER`, `POWERLENS`, `POWERWEIGHT`, `PSYCHICGEM`, `PSYCHICSEED`, `PUNCHINGGLOVE`, `QUICKCLAW`, `QUICKPOWDER`, `RAWSTBERRY`, `RAZORCLAW`, `REDCARD`, `RINDOBERRY`, `ROCKGEM`, `ROCKINCENSE`, `ROCKYHELMET`, `ROOMSERVICE`, `ROSEINCENSE`, `ROSELIBERRY`, `ROWAPBERRY`, `SALACBERRY`, `SCOPELENS`, `SEAINCENSE`, `SHARPBEAK`, `SHEDSHELL`, `SHELLBELL`, `SHUCABERRY`, `SILKSCARF`, `SILVERPOWDER`, `SITRUSBERRY`, `SKYPLATE`, `SMOKEBALL`, `SMOOTHROCK`, `SNOWBALL`, `SOFTSAND`, `SOULDEW`, `SPELLTAG`, `SPLASHPLATE`, `SPOOKYPLATE`, `STARFBERRY`, `STEELGEM`, `STICK`, `STICKYBARB`, `STONEPLATE`, `SUPEREVIOLITE`, `TANGABERRY`, `TERRAINEXTENDER`, `THICKCLUB`, `THROATSPRAY`, `TOXICORB`, `TOXICPLATE`, `TWISTEDSPOON`, `WACANBERRY`, `WATERGEM`, `WAVEINCENSE`, `WEAKNESSPOLICY`, `WELLSPRINGMASK`, `WHITEHERB`, `WIDELENS`, `WIKIBERRY`, `WISEGLASSES`, `YACHEBERRY`, `ZAPPLATE`, `ZOOMLENS`

