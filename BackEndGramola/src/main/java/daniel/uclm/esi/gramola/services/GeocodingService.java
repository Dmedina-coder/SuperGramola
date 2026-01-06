package daniel.uclm.esi.gramola.services;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/** Servicio para obtener coordenadas geográficas usando Photon API (más rápida y precisa que Nominatim). */

@Service
public class GeocodingService {

    private static final Logger logger = LoggerFactory.getLogger(GeocodingService.class);
    private static final String PHOTON_URL = "https://photon.komoot.io/api/";
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GeocodingService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Obtiene las coordenadas (latitud y longitud) de una dirección usando Photon API.
     * 
     * @param direccion La dirección a geocodificar
     * @return Un array con [latitud, longitud]
     * @throws Exception Si no se pueden obtener las coordenadas
     */
    public double[] obtenerCoordenadas(String direccion) {
        if (direccion == null || direccion.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La dirección no puede estar vacía");
        }

        // Normalizar la dirección: reemplazar términos en español por inglés
        String direccionNormalizada = direccion
            .replace("España", "Spain")
            .trim();

        logger.info("Buscando coordenadas para: {} (normalizada: {})", direccion, direccionNormalizada);
        
        try {
            // Construir la URL con parámetros (sin lang o con default)
            String url = String.format("%s?q=%s&limit=1",
                    PHOTON_URL,
                    java.net.URLEncoder.encode(direccionNormalizada, "UTF-8"));

            logger.debug("URL de búsqueda Photon: {}", url);

            // Realizar la petición (Photon no requiere User-Agent especial)
            String response = restTemplate.getForObject(url, String.class);
            logger.debug("Respuesta de Photon: {}", response);
            
            // Parsear la respuesta JSON (formato GeoJSON)
            JsonNode root = objectMapper.readTree(response);
            JsonNode features = root.get("features");
            
            if (features != null && features.isArray() && features.size() > 0) {
                JsonNode firstResult = features.get(0);
                JsonNode geometry = firstResult.get("geometry");
                JsonNode coordinates = geometry.get("coordinates");
                
                // En GeoJSON el formato es [longitud, latitud]
                double lon = coordinates.get(0).asDouble();
                double lat = coordinates.get(1).asDouble();
                
                logger.info("✓ Coordenadas encontradas para '{}': lat={}, lon={}", direccion, lat, lon);
                return new double[]{lat, lon};
            }
            
            // Si Photon no encuentra, lanzar excepción
            logger.warn("✗ No se encontraron coordenadas para: {}", direccion);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, 
                "No se pudieron encontrar coordenadas para la dirección proporcionada");

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Error al buscar coordenadas: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                "Error al consultar el servicio de geocodificación: " + e.getMessage());
        }
    }
}
