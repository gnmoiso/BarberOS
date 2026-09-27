package monedas.api.infraestructura.persistencia.mapeadores;

import monedas.api.dominio.entidades.Moneda;
import monedas.api.infraestructura.persistencia.entidades.MonedaEntidad;

public class MonedaMapeador {

    public static Moneda toModelo(MonedaEntidad entidad) {
        if (entidad == null) {
            return null;
        }
        return new Moneda(
            entidad.getId(),
            entidad.getNombre(),
            entidad.getSigla(),
            entidad.getSimbolo(),
            entidad.getEmisor()
        );
    }

    public static MonedaEntidad toEntidad(Moneda moneda) {
        if (moneda == null) {
            return null;
        }
        return new MonedaEntidad(
            moneda.getId(),
            moneda.getNombre(),
            moneda.getSigla(),
            moneda.getSimbolo(),
            moneda.getEmisor()
        );
    }
}
