![NPM Version](https://img.shields.io/npm/v/%40uvdsl%2Fsolid-access-requests)

# Solid Access Requests

A lightweight TypeScript library for generating **Solid Access Requests**.

It allows you to dynamically build Access Requests for **Required** and **Optional** bundles of resources using a simple Builder pattern.

## Installation

```bash
npm install @uvdsl/solid-access-requests
```

## Features

  * **Builder Pattern:** Chain methods to easily construct complex requests.
  * **Type Safe:** Built with TypeScript to ensure valid Access Modes and Necessities.
  * **Lightweight:** Zero runtime dependencies (outputs standard Turtle strings).

## Usage

### 1\. Import the library

```typescript
import { 
  AccessRequestGenerator, 
  AccessMode 
} from '@uvdsl/solid-access-requests';
```

### 2\. Create a Request

```typescript
// 1. Initialize with Actors and Context
const request = new AccessRequestGenerator({
  requester: 'https://lisa.solid.aifb.kit.edu/profile/card#me',
  recipient: 'https://your-pod.solidcommunity.net/profile/card#me',
  grantee:   'https://lisa.solid.aifb.kit.edu/profile/card#me',
  purpose:   'https://w3id.org/dpv#ServiceProvision',
  context:   'https://example.com/personalisedServiceOffers/042'
});

// 2. Add a REQUIRED bundle (User MUST grant these to proceed)
request.addRequiredGroup([
  { 
    instanceUri: '/resources/privateResource', 
    modes: [AccessMode.Read] 
  },
  { 
    instanceUri: '/resources/privateContainer/', 
    modes: [AccessMode.Read, AccessMode.Append] 
  }
]);

// 3. Add an OPTIONAL bundle (User can choose to reject these)
request.addOptionalGroup([
  { 
    instanceUri: '/resources/otherResource', 
    modes: [AccessMode.Write] 
  }
]);

// 4. Generate the request body in Turtle serialisation
const requestBody = request.toTTL();
console.log(requestBody);
```

### 3\. Send it (Integration with `solid-requests`)

You can use the output of this library either using the regular `fetch` or with convenience by `@uvdsl/solid-requests`:

```typescript
import { createResource } from '@uvdsl/solid-requests';

// ... generate access request as above ...
await createResource(
  'https://your-pod.solidcommunity.net/inbox/', 
  requestBody
);
```

## API Reference

### `AccessRequestGenerator`

#### `constructor(config: AccessRequestConfig)`

Initializes the generator with the requester, recipient, grantee, and purpose URIs.

#### `addRequiredGroup(resources: ResourceDefinition[])`

Adds a group of resources that are mandatory. Sets `interop:accessNecessity` to `interop:AccessRequired`.

#### `addOptionalGroup(resources: ResourceDefinition[])`

Adds a group of resources that are optional. Sets `interop:accessNecessity` to `interop:AccessOptional`.

#### `toTTL(): string`

Compiles the added groups and configuration into a formatted RDF Turtle string.

## Development

Clone the repository and install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Build the project:

```bash
npm run build
```

## License

MIT