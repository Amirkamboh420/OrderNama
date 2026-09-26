import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Mail, ShoppingBag } from "lucide-react";

const pages = {
  about: {
    title: "About OrderNama",
    intro: "OrderNama is an order management workspace for online sellers who take orders through social channels.",
    sections: [
      ["Built around everyday seller work", "Keep order details, customer history, stock, payment status and delivery progress together instead of spreading them across chats and sheets."],
      ["Made for local workflows", "The product includes support for Pakistani payment methods, PKR pricing and Roman Urdu friendly workflows."],
    ],
  },
  careers: {
    title: "Careers",
    intro: "There are no open roles listed right now.",
    sections: [["Keep in touch", "If you would like to work with OrderNama in the future, send a short introduction and your area of interest to our support email."]],
  },
  blog: {
    title: "OrderNama Blog",
    intro: "Product updates and seller guides will be published here.",
    sections: [["No articles yet", "We are preparing practical guides for managing social commerce orders, customer records, inventory and delivery workflows."]],
  },
  terms: {
    title: "Terms of Service",
    intro: "This page describes the current demo product and is not a final service contract.",
    sections: [
      ["Demo use", "The current workspace includes sample seller and order data. Do not treat sample data, displayed plans or feature previews as a live paid subscription or production service guarantee."],
      ["Seller responsibility", "Before using a production service, sellers should confirm they have permission to collect and use customer contact, address and order information, and should provide their customers with appropriate notices."],
      ["Questions", "For questions about the service terms, contact support@ordernama.com before relying on this demo for live business data."],
    ],
  },
  privacy: {
    title: "Privacy Overview",
    intro: "OrderNama screens and APIs are designed to manage seller, customer, order, inventory, staff and support-ticket information.",
    sections: [
      ["Information in the demo", "The database schema includes business contact details, customer names and phone numbers, delivery addresses, order contents, staff records, support messages and form activity. Demo seed data is illustrative."],
      ["Storage and controls", "The project uses a PostgreSQL database configured by the operator. This codebase does not currently show account-based access controls, customer self-service deletion, or a retention schedule, so avoid entering sensitive real customer data into an unconfigured deployment."],
      ["Requests", "For privacy questions or a request to correct or remove information from a deployment, contact its operator at support@ordernama.com."],
    ],
  },
  "whatsapp-compliance": {
    title: "WhatsApp Messaging",
    intro: "Use customer messaging responsibly and only in ways customers expect.",
    sections: [
      ["Customer consent", "Before sending promotional or order-related messages, make sure customers have provided an appropriate phone number and understand why they may be contacted."],
      ["Current demo behavior", "The demo records generated WhatsApp messages in its activity log. A live WhatsApp Business delivery integration is not configured in this project."],
      ["Support", "For setup questions, contact support@ordernama.com."],
    ],
  },
  "data-export": {
    title: "Data Export",
    intro: "The dashboard includes export actions for business records.",
    sections: [
      ["Orders", "Open Orders in the dashboard and use its export actions to download order records. PDF invoice and customer document actions are also available where shown."],
      ["Keep a secure copy", "Store downloaded files in a private location and share them only with people who need access to the information."],
      ["Need help?", "Contact support@ordernama.com if you need help finding an export in the demo."],
    ],
  },
} as const;

export type PublicInfoSlug = keyof typeof pages;

export function PublicInfoPage({ page }: { page: PublicInfoSlug }) {
  const content = pages[page];
  return (
    <main className="min-h-screen bg-brand-50/30 px-4 py-10 sm:px-6 sm:py-16">
      <article className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-sm">
        <header className="bg-brand-gradient p-7 text-white sm:p-10">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-white/80 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> OrderNama home</Link>
          <div className="mt-8 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15"><ShoppingBag className="h-5 w-5" /></span><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">OrderNama</span></div>
          <h1 className="mt-5 text-3xl font-extrabold sm:text-4xl">{content.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">{content.intro}</p>
        </header>
        <div className="space-y-7 p-7 sm:p-10">
          {content.sections.map(([heading, text]) => <section key={heading}><h2 className="text-lg font-bold text-foreground">{heading}</h2><p className="mt-2 text-sm leading-7 text-muted-foreground">{text}</p></section>)}
          <div className="flex flex-col gap-3 border-t border-brand-100 pt-6 sm:flex-row">
            <Link href="/features" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 py-3 text-sm font-semibold text-white hover:opacity-90">Explore features <ArrowRight className="h-4 w-4" /></Link>
            <a href="mailto:support@ordernama.com" className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-200 px-5 py-3 text-sm font-semibold text-brand-800 hover:bg-brand-50"><Mail className="h-4 w-4" /> Contact support</a>
          </div>
          <p className="flex items-center gap-2 text-xs text-muted-foreground"><BookOpen className="h-3.5 w-3.5" /> Informational page · OrderNama</p>
        </div>
      </article>
    </main>
  );
}
