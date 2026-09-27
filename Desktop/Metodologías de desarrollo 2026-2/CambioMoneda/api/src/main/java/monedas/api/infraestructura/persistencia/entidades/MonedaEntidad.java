package monedas.api.infraestructura.persistencia.entidades;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;

@Entity
@Table(name = "moneda")
public class MonedaEntidad {

    @Id
    @Column(name = "id")
    @GeneratedValue(strategy = GenerationType.AUTO, generator = "secuencia_moneda")
    @SequenceGenerator(name = "secuencia_moneda", sequenceName = "secuencia_moneda", allocationSize = 1)
    private int id;

    @Column(name = "moneda", length = 100)
    private String nombre;

    @Column(name = "sigla", length = 5)
    private String sigla;

    @Column(name = "simbolo", nullable = true, length = 5)
    private String simbolo;

    @Column(name = "emisor", nullable = true, length = 100)
    private String emisor;

    public MonedaEntidad() {
    }

    public MonedaEntidad(int id, String nombre, String sigla, String simbolo, String emisor) {
        this.id = id;
        this.nombre = nombre;
        this.sigla = sigla;
        this.simbolo = simbolo;
        this.emisor = emisor;
    }

    // Getters y Setters necesarios para Hibernate/JPA
    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getSigla() {
        return sigla;
    }

    public void setSigla(String sigla) {
        this.sigla = sigla;
    }

    public String getSimbolo() {
        return simbolo;
    }

    public void setSimbolo(String simbolo) {
        this.simbolo = simbolo;
    }

    public String getEmisor() {
        return emisor;
    }

    public void setEmisor(String emisor) {
        this.emisor = emisor;
    }
}