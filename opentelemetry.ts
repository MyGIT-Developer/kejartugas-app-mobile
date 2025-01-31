import {
  CompositePropagator,
  W3CBaggagePropagator,
  W3CTraceContextPropagator,
} from '@opentelemetry/core';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { Resource } from '@opentelemetry/resources';
// import {
//   ATTR_DEVICE_ID,
//   ATTR_OS_NAME,
//   ATTR_OS_VERSION,
//   ATTR_SERVICE_NAME,
//   ATTR_SERVICE_VERSION,
// } from '@opentelemetry/semantic-conventions/incubating';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
// import getLocalhost from '@/utils/Localhost';
import { useEffect, useState } from 'react';
// import {
//   getDeviceId,
//   getSystemVersion,
//   getVersion,
// } from 'react-native-device-info';
import { Platform } from 'react-native';
// import { SessionIdProcessor } from '@/utils/SessionIdProcessor';
import {
	SpanExporter,
	ReadableSpan,
	TimedEvent,
} from '@opentelemetry/sdk-trace-base'
import type { Link, Attributes } from '@opentelemetry/api'
import { ExportResultCode } from '@opentelemetry/core'


type KeyValue = {
	key: string
	value: KeyValue
}


class ReactNativeOTLPTraceExporter implements SpanExporter {
  url: string

  constructor(options: { url: string }) {
    this.url = options.url

    this._buildResourceSpans = this._buildResourceSpans.bind(this)
    this._convertEvent = this._convertEvent.bind(this)
    this._convertToOTLPFormat = this._convertToOTLPFormat.bind(this)
    this._convertLink = this._convertLink.bind(this)
    this._convertAttributes = this._convertAttributes.bind(this)
    this._convertKeyValue = this._convertKeyValue.bind(this)
    this._toAnyValue = this._toAnyValue.bind(this)
  }

  export(spans: ReadableSpan[], resultCallback: any) {
    fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: this._buildResourceSpans(spans),
    })
      .then(() => {
        resultCallback({ code: ExportResultCode.SUCCESS })
      })
      .catch((err) => {
        resultCallback({ code: ExportResultCode.FAILED, error: err })
      })
  }

  shutdown() {
    return Promise.resolve()
  }

  _buildResourceSpans(spans: ReadableSpan[] = []) {
    const resource = spans[0]?.resource
    const scope = spans[0]?.instrumentationLibrary

    return JSON.stringify({
      resourceSpans: [
        {
          resource: {
            attributes: resource.attributes
              ? this._convertAttributes(resource.attributes)
              : [],
          },
          scopeSpans: [
            {
              scope: {
                name: scope?.name,
                version: scope?.version,
              },
              spans: spans.map(this._convertToOTLPFormat),
            },
          ],
        },
      ],
    })
  }

  _convertToOTLPFormat(span: ReadableSpan) {
    const spanContext = span.spanContext()
    const status = span.status

    return {
      traceId: spanContext.traceId,
      spanId: spanContext.spanId,
      parentSpanId: span.parentSpanId,
      traceState: spanContext.traceState?.serialize(),
      name: span.name,
      // Span kind is offset by 1 because the API does not define a value for unset
      kind: span.kind == null ? 0 : span.kind + 1,
      startTimeUnixNano: span.startTime[0] * 1e9 + span.startTime[1],
      endTimeUnixNano: span.endTime[0] * 1e9 + span.endTime[1],
      attributes: span.attributes
        ? this._convertAttributes(span.attributes)
        : [],
      droppedAttributesCount: span.droppedAttributesCount || 0,
      events: span.events?.map(this._convertEvent) || [],
      droppedEventsCount: span.droppedEventsCount || 0,
      status: {
        code: status.code,
        message: status.message,
      },
      links: span.links?.map(this._convertLink) || [],
      droppedLinksCount: span.droppedLinksCount,
    }
  }

  _convertEvent(timedEvent: TimedEvent) {
    return {
      attributes: timedEvent.attributes
        ? this._convertAttributes(timedEvent.attributes)
        : [],
      name: timedEvent.name,
      timeUnixNano: timedEvent.time[0] * 1e9 + timedEvent.time[1],
      droppedAttributesCount: timedEvent.droppedAttributesCount || 0,
    }
  }

  _convertLink(link: Link) {
    return {
      attributes: link.attributes
        ? this._convertAttributes(link.attributes)
        : [],
      spanId: link.context.spanId,
      traceId: link.context.traceId,
      traceState: link.context.traceState?.serialize(),
      droppedAttributesCount: link.droppedAttributesCount || 0,
    }
  }

  _convertAttributes(attributes: Attributes) {
    return Object.keys(attributes).map((key) =>
      this._convertKeyValue(key, attributes[key]),
    )
  }

  _convertKeyValue(key: string, value: any): KeyValue {
    return {
      key: key,
      value: this._toAnyValue(value),
    }
  }

  _toAnyValue(value: any): any {
    const t = typeof value
    if (t === 'string') return { stringValue: value as string }
    if (t === 'number') {
      if (!Number.isInteger(value))
        return { doubleValue: value as number }
      return { intValue: value as number }
    }
    if (t === 'boolean') return { boolValue: value as boolean }
    if (value instanceof Uint8Array) return { bytesValue: value }
    if (Array.isArray(value))
      return { arrayValue: { values: value.map(this._toAnyValue) } }
    if (t === 'object' && value != null)
      return {
        kvlistValue: {
          values: Object.entries(value as object).map(([k, v]) =>
            this._convertKeyValue(k, v),
          ),
        },
      }

    return {}
  }
}



const Tracer = async () => {
  // const localhost = await getLocalhost();

  // const resource = new Resource({
  //   [ATTR_SERVICE_NAME]: 'react-native-app',
  //   [ATTR_OS_NAME]: Platform.OS,
  //   [ATTR_OS_VERSION]: getSystemVersion(),
  //   [ATTR_SERVICE_VERSION]: getVersion(),
  //   [ATTR_DEVICE_ID]: getDeviceId(),
  // });
  const resource = new Resource({
    'service.name': 'kt-mobile-app',
    'deployment.environment': 'KejarTugas',
    // 'device.id': getDeviceId(),
    'os.name': Platform.OS,
    // 'os.version': getSystemVersion(),
    // 'service.version': getVersion(),
  });


  const provider = new WebTracerProvider({
    resource,
    spanProcessors: [
      new BatchSpanProcessor(
        new ReactNativeOTLPTraceExporter({
          url: `https://app.kejartugas.com/v1/traces`,
        }),
        {
          scheduledDelayMillis: 500,
        },
      ),
      // new SessionIdProcessor(),
    ],
  });

  provider.register({
    propagator: new CompositePropagator({
      propagators: [
        new W3CBaggagePropagator(),
        new W3CTraceContextPropagator(),
      ],
    }),
  });

  registerInstrumentations({
    instrumentations: [
      // Some tiptoeing required here, propagateTraceHeaderCorsUrls is required to make the instrumentation
      // work in the context of a mobile app even though we are not making CORS requests. `clearTimingResources` must
      // be turned off to avoid using the web-only Performance API
      new FetchInstrumentation({
        propagateTraceHeaderCorsUrls: /.*/,
        clearTimingResources: false,
      }),

      // The React Native implementation of fetch is simply a polyfill on top of XMLHttpRequest:
      // https://github.com/facebook/react-native/blob/7ccc5934d0f341f9bc8157f18913a7b340f5db2d/packages/react-native/Libraries/Network/fetch.js#L17
      // Because of this when making requests using `fetch` there will an additional span created for the underlying
      // request made with XMLHttpRequest. Since in this demo calls to /api/ are made using fetch, turn off
      // instrumentation for that path to avoid the extra spans.
      new XMLHttpRequestInstrumentation({
        ignoreUrls: [/\/api\/.*/],
      }),
    ],
  });
};

// export interface TracerResult {
//   loaded: boolean;
// }

// export const useTracer = (): TracerResult => {
//   const [loaded, setLoaded] = useState<boolean>(false);

//   useEffect(() => {
//     if (!loaded) {
//       Tracer()
//         .catch(() => console.warn('failed to setup tracer'))
//         .finally(() => setLoaded(true));
//     }
//   }, [loaded]);

//   return {
//     loaded,
//   };
// };

export default Tracer;