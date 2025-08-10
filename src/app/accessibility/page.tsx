import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AccessibilityPage() {
  return (
    <div className="container max-w-4xl mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl md:text-4xl">Accessibility Statement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            My Genius Calculator is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.
          </p>
          
          <h2 className="text-2xl font-headline text-foreground pt-4">Conformance Status</h2>
          <p>
            The <a href="https://www.w3.org/WAI/standards-guidelines/wcag/" className="text-primary hover:underline">Web Content Accessibility Guidelines (WCAG)</a> defines requirements for designers and developers to improve accessibility for people with disabilities. It defines three levels of conformance: Level A, Level AA, and Level AAA.
          </p>
          <p>
            My Genius Calculator is partially conformant with WCAG 2.2 level AA. Partially conformant means that some parts of the content do not fully conform to the accessibility standard. We are actively working to achieve full conformance.
          </p>

          <h2 className="text-2xl font-headline text-foreground pt-4">Our Approach</h2>
           <ul className="list-disc pl-6 space-y-2">
            <li><strong>Keyboard Navigation:</strong> All interactive elements are fully navigable using a keyboard.</li>
            <li><strong>Screen Reader Support:</strong> We use semantic HTML and ARIA attributes to ensure our content is understandable and operable with screen readers.</li>
            <li><strong>Visible Focus:</strong> All focusable elements have a clear and visible focus indicator.</li>
            <li><strong>Color Contrast:</strong> Our color palette is designed to meet or exceed the WCAG 2.2 AA contrast ratios for text and graphical elements.</li>
            <li><strong>Descriptive Text:</strong> We provide descriptive labels for form fields, clear error messages, and alternative text for meaningful images.</li>
          </ul>

          <h2 className="text-2xl font-headline text-foreground pt-4">Feedback</h2>
          <p>
            We welcome your feedback on the accessibility of My Genius Calculator. Please let us know if you encounter accessibility barriers:
          </p>
          <p>
            E-mail: <a href="mailto:feedback@mygeniuscalculator.com" className="text-primary hover:underline">feedback@mygeniuscalculator.com</a>
          </p>
          <p>
            We try to respond to feedback within 5 business days.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
