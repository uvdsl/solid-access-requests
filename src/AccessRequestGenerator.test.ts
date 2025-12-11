// AccessRequestGenerator.test.ts
import { AccessRequestGenerator, AccessMode, AccessNecessity } from './AccessRequestGenerator';

describe('AccessRequestGenerator', () => {
    it('generates a valid RDF graph with required and optional bundles', () => {
        // 1. Setup
        const config = {
            requester: 'https://requester.example/id',
            recipient: 'https://recipient.example/id',
            grantee: 'https://grantee.example/id',
            purpose: 'https://w3id.org/dpv#purpose',
            context: 'https://context.example/info'
        };

        const generator = new AccessRequestGenerator(config);

        // 2. Add Required Group (Read Private Resource, Read/Append Container)
        generator.addRequiredGroup([
            {
                instanceUri: '/resources/privateResource',
                modes: [AccessMode.Read]
            },
            {
                instanceUri: '/resources/privateContainer/',
                modes: [AccessMode.Read, AccessMode.Append]
            }
        ]);

        // 3. Add Optional Group (Write Other Resource)
        generator.addOptionalGroup([
            {
                instanceUri: '/resources/otherResource',
                modes: [AccessMode.Write]
            }
        ]);

        // 4. Generate Output
        const rdfOutput = generator.toTTL();

        // 5. Assertions

        // Check Prefixes
        expect(rdfOutput).toContain('@prefix interop: <http://www.w3.org/ns/solid/interop#> .');

        // Check Root Request
        expect(rdfOutput).toContain('a interop:AccessRequest ;');
        expect(rdfOutput).toContain(`interop:fromSocialAgent <${config.requester}>`);
        expect(rdfOutput).toContain(`interop:toSocialAgent <${config.recipient}>`);
        expect(rdfOutput).toContain(`interop:forSocialAgent <${config.grantee}>`);
        expect(rdfOutput).toContain(`dpv:purpose <${config.purpose}>`);
        expect(rdfOutput).toContain(`rdfs:seeAlso <${config.context}>`);

        // Check that the Root links to BOTH groups (0 and 1)
        // Note: This regex allows for flexible whitespace/newlines
        expect(rdfOutput).toMatch(/interop:hasAccessNeedGroup .*<#AccessNeedGroup-0>/);
        expect(rdfOutput).toMatch(/interop:hasAccessNeedGroup .*<#AccessNeedGroup-1>/);

        // Check Group 0 (Required)
        expect(rdfOutput).toContain('<#AccessNeedGroup-0>');
        expect(rdfOutput).toContain(`interop:accessNecessity ${AccessNecessity.Required}`);
        expect(rdfOutput).toMatch(/interop:hasAccessNeed .*<#AccessNeed-0-0>/);
        expect(rdfOutput).toMatch(/interop:hasAccessNeed .*<#AccessNeed-0-1>/);

        // Check Group 1 (Optional)
        expect(rdfOutput).toContain('<#AccessNeedGroup-1>');
        expect(rdfOutput).toContain(`interop:accessNecessity ${AccessNecessity.Optional}`);

        // Check Specific Resource Need (Leaf Node)
        // Needs to ensure the modes and instance URI are correct
        expect(rdfOutput).toContain('<#AccessNeed-0-1>'); // The Container
        expect(rdfOutput).toContain(`interop:hasDataInstance </resources/privateContainer/>`);
        expect(rdfOutput).toContain('interop:accessMode acl:Read, acl:Append');
        expect(rdfOutput).toContain(`interop:accessNecessity ${AccessNecessity.Required}`);
    });

});