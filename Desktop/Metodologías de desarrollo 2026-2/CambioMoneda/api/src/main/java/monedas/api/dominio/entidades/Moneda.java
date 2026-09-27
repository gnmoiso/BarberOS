package monedas.api.dominio.entidades;

public class Moneda {

    private int id;
    private String nombre;
    private String sigla;
    private String simbolo;
    private String emisor;

    public Moneda() {
    }

    public Moneda(int id, String nombre, String sigla, String simbolo, String emisor) {
        this.id = id;
        this.nombre = nombre;
        this.sigla = sigla;
        this.simbolo = simbolo;
        this.emisor = emisor;
    }

    // Regla de negocio / Comportamiento del Dominio
    public boolean esMonedaOficial() {
        return this.emisor != null && !this.emisor.trim().isEmpty();
    }

    // Getters y Setters
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