/**
 * 1. DEFINITIONS & TYPES
 */

export enum AccessMode {
  Read = 'acl:Read',
  Write = 'acl:Write',
  Append = 'acl:Append',
  Control = 'acl:Control',
}

export enum AccessNecessity {
  Required = 'interop:AccessRequired',
  Optional = 'interop:AccessOptional',
}

// Simplified: We only care about Data Instances now
export interface ResourceDefinition {
  instanceUri: string;
  modes: AccessMode[];
}

interface AccessRequestConfig {
  requester: string;  // URI
  recipient: string;  // URI
  grantee: string;    // URI
  purpose: string;    // URI
  context: string; // URI
}

/**
 * 2. THE GENERATOR CLASS
 */
export class AccessRequestGenerator {
  private config: AccessRequestConfig;

  // Stores groups of resources, categorized by necessity
  private groups: { necessity: AccessNecessity; resources: ResourceDefinition[] }[] = [];

  constructor(config: AccessRequestConfig) {
    this.config = config;
  }

  /**
   * Create a mandatory bundle of resources.
   * The user MUST accept these to use the app.
   */
  public addRequiredGroup(resources: ResourceDefinition[]) {
    this.groups.push({
      necessity: AccessNecessity.Required,
      resources,
    });
    return this; // Enable chaining
  }

  /**
   * Create an optional bundle of resources.
   * The user can choose to grant or reject this specific bundle.
   */
  public addOptionalGroup(resources: ResourceDefinition[]) {
    this.groups.push({
      necessity: AccessNecessity.Optional,
      resources,
    });
    return this; // Enable chaining
  }

  /**
   * compiles the object graph into a Turtle string
   */
  public toTTL(): string {
    const { requester, recipient, grantee, purpose, context: contextUri } = this.config;

    let rdf = `
@prefix interop: <http://www.w3.org/ns/solid/interop#> .
@prefix ldp: <http://www.w3.org/ns/ldp#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix acl: <http://www.w3.org/ns/auth/acl#> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix dpv: <https://w3id.org/dpv#> .
\n`;

    const groupIds: string[] = [];

    // Iterate over the groups defined by the user
    this.groups.forEach((group, groupIndex) => {
      const groupId = `<#AccessNeedGroup-${groupIndex}>`;
      groupIds.push(groupId);

      const needIds: string[] = [];

      // Generate the individual Access Needs (Leaf nodes)
      group.resources.forEach((res, resIndex) => {
        const needId = `<#AccessNeed-${groupIndex}-${resIndex}>`;
        needIds.push(needId);

        rdf += `
${needId}
  a interop:AccessNeed ;
  interop:accessMode ${res.modes.join(', ')} ;
  interop:hasDataInstance <${res.instanceUri}> ;
  interop:accessNecessity ${group.necessity} .
`;
      });

      // Generate the Group node linking to the leaf nodes
      rdf += `
${groupId}
  a interop:AccessNeedGroup ;
  interop:accessNecessity ${group.necessity} ;
  interop:accessScenario interop:sharedAccess ;
  interop:authenticatesAs interop:SocialAgent ;
  interop:hasAccessNeed ${needIds.join(', ')} .
`;
    });

    // Generate the Root Access Request node
    rdf += `
<#AccessRequest>
  a interop:AccessRequest ;
  interop:fromSocialAgent <${requester}> ;
  interop:toSocialAgent <${recipient}> ;
  interop:forSocialAgent <${grantee}> ;
  interop:hasAccessNeedGroup ${groupIds.join(', ')} ;
  dpv:purpose <${purpose}>  ;
  rdfs:seeAlso <${contextUri}> .
`;

    return rdf;
  }
}