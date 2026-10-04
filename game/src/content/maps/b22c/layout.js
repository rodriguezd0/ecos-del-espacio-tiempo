const p=(x,y,dir=8)=>Object.freeze({x,y,dir});
export const SITES=Object.freeze({
  lugia:{id:'sima_marina',width:32,height:30,entry:p(16,26),exit:p(16,27,2),legend:p(16,6,2),stand:p(16,7),
    access:{map:'fondo_mar_sur',x:104,y:42},back:{map:'fondo_mar_sur',...p(104,43,2)},guide:p(14,25,2)},
  kyogre:{id:'fosa_abisal',width:32,height:28,entry:p(16,24),exit:p(16,25,2),legend:p(16,7,2),stand:p(16,8),
    access:{map:'fondo_mar_sur',x:170,y:27},back:{map:'fondo_mar_sur',...p(169,27,4)}},
  groudon:{id:'veta_magmatica',width:32,height:28,entry:p(16,24),exit:p(16,25,2),legend:p(16,7,2),stand:p(16,8),altar:p(14,21,2),
    access:{map:'tizon_cueva',x:31,y:44},back:{map:'tizon_cueva',...p(30,44,4)}},
  rayquaza:{id:'balcon_cielo',width:30,height:28,entry:p(15,24),exit:p(15,25,2),legend:p(15,6,2),stand:p(15,7),tutor:p(17,22,2),
    access:{map:'cumbre_azur',x:18,y:13},back:{map:'cumbre_azur',...p(17,13,4)}},
});
export const HOOKS=Object.freeze({
  rain:{map:'mar_del_sur',...p(175,28)},
  latias:{map:'lagos_alma',...p(47,28,4)},
  blue:{map:'antea_2_antea',...p(22,17,2)},
  dew:{map:'antea_2_antea',...p(23,17,2)},
  red:{map:'mina_galena_honda',...p(12,12,2)},
});
export const LATIOS_ROUTE=Object.freeze([p(32,22,4),p(97,32,4),p(151,31,4)]);
// Puntos de Aerochorro. La guía accesible utiliza estas mismas casillas en ambos sentidos.
export const LUGIA_ROUTE=Object.freeze([p(16,23),p(9,23),p(9,17),p(23,17),p(23,11),p(16,11),p(16,7)]);
