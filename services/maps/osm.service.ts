import axios from "axios";

export async function searchPlaces(query: string) {
  if (!query.trim()) return [];

  try {
    const { data } = await axios.get(
      "https://photon.komoot.io/api",
      {
        params: {
          q: query,
          limit: 5,
        },
      }
    );

    return data.features.map((feature: any) => {
      const props = feature.properties;

      const [longitude, latitude] =
        feature.geometry.coordinates;

      return {
        id: props.osm_id,

        name: [
          props.name,
          props.city,
          props.state,
          props.country,
        ]
          .filter(Boolean)
          .join(", "),

        latitude,

        longitude,
      };
    });
  } catch (error) {
    console.log("Photon Error", error);

    return [];
  }
}