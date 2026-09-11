import cron from "node-cron";
import {
  notificarAusenciasSemRegistoPonto,
  notificarSaidaPendenteAntesDoFecho,
} from "./ponto.service.js";
import { logger } from "../../../config/logger.js";
import { listarMunicipios } from "../../municipios/municipios.service.js"; 

cron.schedule(
  "50 15 * * 1-5",
  async () => {
    const municipios = await listarMunicipios();
    for (const municipio of municipios) {
      try {
        const { notificados } = await notificarSaidaPendenteAntesDoFecho({ municipioId: municipio.id });
        logger.info({ municipioId: municipio.id, notificados }, "Lembrete de saída pendente enviado");
      } catch (error) {
        logger.error({ err: error, municipioId: municipio.id }, "Falha ao notificar saída pendente");
      }
    }
  },
  { timezone: "Africa/Luanda" }
);

cron.schedule(
  "0 10 * * 1-5",
  async () => {
    const municipios = await listarMunicipios();
    for (const municipio of municipios) {
      try {
        const { notificados } = await notificarAusenciasSemRegistoPonto({ municipioId: municipio.id });
        logger.info({ municipioId: municipio.id, notificados }, "Notificação de ausência de ponto enviada");
      } catch (error) {
        logger.error({ err: error, municipioId: municipio.id }, "Falha ao notificar ausência de ponto");
      }
    }
  },
  { timezone: "Africa/Luanda" }
);