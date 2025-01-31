import { registerRootComponent } from 'expo';

// SIGNOZ
import Tracer from './opentelemetry'; // Import the Tracer function

// Initialize the tracer
Tracer();

// SIGNOZ END

import App from './App';

registerRootComponent(App);
