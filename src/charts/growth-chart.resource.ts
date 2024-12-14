import useSWR from 'swr';
import { fhirBaseUrl, openmrsFetch } from '@openmrs/esm-framework';

/**
 * This hook searches for a patient using the provided search term from the
 * OpenMRS FHIR API.It leverages the useSWR hook from the SWR library
 * https://swr.vercel.app/docs/data-fetching to fetch data. SWR provides a
 * number of benefits over the standard React useEffect hook, including:
 *
 * - Fast, lightweight and reusable data fetching
 * - Built-in cache and request deduplication
 * - Real-time updates
 * - Simplified error and loading state handling, and more.
 *
 *  We recommend using SWR for data fetching in your OpenMRS frontend modules.
 *
 * See the docs for the underlying fhir.js Client object: https://github.com/FHIR/fhir.js#api
 * See the OpenMRS FHIR Module docs: https://wiki.openmrs.org/display/projects/OpenMRS+FHIR+Module
 * See the OpenMRS REST API docs: https://rest.openmrs.org/#openmrs-rest-api
 *
 * @param query A patient name or ID
 * @returns The first matching patient
 */

interface FHIRResponse {
  entry: Array<{ resource: fhir.Location }>;
  total: number;
  type: string;
  resourceType: string;
}

export function useGrowthData(patientUuid: string) {
  const apiUrl = `${fhirBaseUrl}/Observation?patient=${patientUuid}&code=height,weight`;

  const { data, error, isLoading } = useSWR<{data: Array<{ resource: fhir.Observation }>;},
    Error
  >(patientUuid ? apiUrl : null, openmrsFetch);


  const growthData = {
    height: [] as { date: string; value: number; unit: string }[],
    weight: [] as { date: string; value: number; unit: string }[],
  };

  if (data) {
    data.data?.forEach(({ resource }) => {
      const { effectiveDateTime, valueQuantity } = resource;

      // Verificar si la observación tiene fecha y valor válido
      if (effectiveDateTime && valueQuantity?.value && valueQuantity.unit) {
        const measurement = {
          date: new Date(effectiveDateTime).toLocaleDateString(),
          value: valueQuantity.value,
          unit: valueQuantity.unit,
        };

        // Filtrar por código de altura y peso
        const code = resource?.code?.coding?.[0]?.code?.toLowerCase();
        if (code === 'height') {
          growthData.height.push(measurement);
        } else if (code === 'weight') {
          growthData.weight.push(measurement);
        }
      }
    });
  }

  return {
    growthData,
    isLoading,
    error,
  };
}
