import type { Metadata } from "next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Privacy Policy - JTDRecipe",
  description: "Privacy Policy for JTDRecipe - Learn how we collect, use, and protect your personal information.",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Privacy Policy</CardTitle>
            <p className="text-center text-gray-600">Effective Date: June 23, 2025</p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-red-600">DISCLAIMER FOR CANADIAN USERS</h2>
              <p className="mb-4">
                As defined under Canadian law, Personal Information means information about an identifiable individual
                ("Personal Information"). The disclosures mentioned herein are meant to transparently convey the methods
                of collecting, managing, storing, using, protecting, and sharing Personal Information by users ("Privacy
                Policy"). Users grant their consent to this Privacy Policy through it being readily available for
                viewing in accordance with the Personal Information Protection and Electronic Documents Act ("PIPEDA").
              </p>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-red-600">DISCLAIMER FOR EUROPEAN USERS</h2>
              <p className="mb-4">
                We would like to make sure you are fully aware of all of your data protection rights. Every user is
                entitled to the following:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>The right to access</strong> - You have the right to request our company for copies of your
                  personal data. We may charge you a small fee for this service.
                </li>
                <li>
                  <strong>The right to rectification</strong> - You have the right to request that our company correct
                  any information you believe is inaccurate. You also have the right to request our company to complete
                  the information you believe is incomplete.
                </li>
                <li>
                  <strong>The right to erasure</strong> - You have the right to request that our company erase your
                  personal data under certain conditions.
                </li>
                <li>
                  <strong>The right to restrict processing</strong> - You have the right to request that our company
                  restrict the processing of your personal data under certain conditions.
                </li>
                <li>
                  <strong>The right to object to processing</strong> - You have the right to object to our company's
                  processing of your personal data under certain conditions.
                </li>
                <li>
                  <strong>The right to data portability</strong> - You have the right to request that our company
                  transfer the data we have collected to another organization or directly to you under certain
                  conditions.
                </li>
              </ul>
              <p className="mt-4">
                If you make a request, we have one month to respond to you. If you would like to exercise any of these
                rights, please contact us at our email:{" "}
                <a href="mailto:aaronhirshka@gmail.com" className="text-blue-600 hover:underline">
                  aaronhirshka@gmail.com
                </a>
              </p>
              <p>
                Call us at:{" "}
                <a href="tel:7246818176" className="text-blue-600 hover:underline">
                  724-681-8176
                </a>
              </p>
              <p>Or write to us: 2366 Morton St, Pittsburgh, Pennsylvania, 15234</p>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-red-600">DISCLAIMER FOR CALIFORNIA USERS</h2>
              <p className="mb-4">
                Your privacy and rights under the California Consumer Privacy Act (CCPA) and the California Online
                Privacy Protection Act (CalOPPA) are important to us. We offer this document as a resource to view how
                we collect, manage, store, and use your Personal Information in the day-to-day running of our website.
                This Privacy Policy, intended for California residents, can be applied to all website users to disclose
                how we collect, manage, store, and use your Personal Information as defined under CIV 1798.140(v) of the
                California Consumer Privacy Act (CCPA).
              </p>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-red-600">CONTACT</h2>
              <p className="mb-4">This Privacy Policy is between you and the following:</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p>
                  <strong>Individual Name:</strong> Aaron Hirshka
                </p>
                <p>
                  <strong>Address:</strong> 2366 Morton St, Pittsburgh, Pennsylvania, 15234
                </p>
                <p>
                  <strong>Phone:</strong>{" "}
                  <a href="tel:7246818176" className="text-blue-600 hover:underline">
                    724-681-8176
                  </a>
                </p>
                <p>
                  <strong>E-Mail:</strong>{" "}
                  <a href="mailto:aaronhirshka@gmail.com" className="text-blue-600 hover:underline">
                    aaronhirshka@gmail.com
                  </a>
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <p>
                  <strong>Website URL:</strong>{" "}
                  <a href="https://www.justthedamnrecipe.net" className="text-blue-600 hover:underline">
                    www.justthedamnrecipe.net
                  </a>
                </p>
                <p>
                  <strong>Website Name:</strong> JustTheDamnRecipe
                </p>
              </div>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-red-600">PERSONAL INFORMATION COLLECTED</h2>
              <p className="mb-4">In the past 12 months, we have or had the intention of collecting the following:</p>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Identifiers</h3>
                  <p>
                    A real name or alias, postal address, signature, home phone number or mobile phone number, bank
                    account number, credit card number, debit card number or other financial information, physical
                    characteristics or description, e-mail address; account name, Social Security Number (SSN), driver's
                    license number or state identification card number, passport number, or other similar identifiers.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold">Internet or Other Similar Network Activity</h3>
                  <p>
                    Browsing history, search history, and information on a consumer's interaction with a website,
                    application, or advertisement.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold">Geolocation Data</h3>
                  <p>
                    Physical location or movements. For example, city, state, country, and ZIP code associated with your
                    IP address or derived through Wi-Fi triangulation; and, with permission in on your mobile device
                    settings, and precise geolocation information from GPS-based functionality on your mobile devices.
                  </p>
                </div>
              </div>

              <p className="mt-4 italic">Hereinafter known as "Personal Information."</p>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-red-600">SOURCES OF INFORMATION WE COLLECT</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Using the website</h3>
                  <p>
                    We collect certain information from your activity on our website, starting when you first arrive and
                    accessing it on an electronic device. We may collect your IP address, device ID, advertising
                    identifiers, browser type, operating system, internet service provider, pages visited (including
                    clicks and duration), and other related log information. For mobile phones, we may collect your
                    device's GPS signal or other information about nearby Wi-Fi access points and cell towers.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold">Creating a User Profile or Account</h3>
                  <p>
                    We may collect information directly from you or an agent authorized to act on your behalf. For
                    example, if you, or someone acting on your behalf, provides your name and e-mail to create a profile
                    or an account. We also collect information indirectly from you or your authorized agent. This can be
                    done through information we collect from you while providing content, products, or services.
                  </p>
                </div>
              </div>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-red-600">COOKIES POLICY</h2>
              <p className="mb-4">
                Currently, our website uses cookies to provide you with the best experience possible. We, in addition to
                our service providers, affiliates, agents, advertisers, or other parties in connection with the website,
                may deploy cookies, web beacons, local shared objects, and other tracking technologies for various
                purposes. Such shall be for business use, marketing purposes, fraud prevention, and to assist in the
                day-to-day operations of the website.
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">a.) "Cookies" Defined</h3>
                  <p>
                    Cookies act as data that is communicated between a user's web browser and a website or application.
                    They are stored on your device to help track their areas of interest, provide the best experience
                    possible, and customize the content, products, services, offerings, and advertisements served on the
                    website. Most web browsers adjust to your browser's settings to decline or delete cookies, but doing
                    so may degrade the experience with our online services.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold">b.) 1-Pixel Images</h3>
                  <p>
                    Clear GIFs, pixel tags, or web beacons, which are generally 1-pixel, are transparent images located
                    on a webpage or in an e-mail or other trackable source and may be used on our website in addition to
                    any other communication offered by us. They are often used in connection with advertisements served
                    to you that are interacted with, whether on our website or another online service and shared with
                    us. This type of tracking is specifically meant to recognize users, assess traffic patterns, and
                    measure site or campaign engagement.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold">c.) Flash Cookies</h3>
                  <p>
                    Local Shared Objects, sometimes known as "flash cookies," may be stored on your device using a media
                    player or other software. Flash cookies are similar to cookies in terms of their operation but may
                    be managed in your browser in the same manner.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold">d.) First (1st) Party & Third (3rd) Cookies</h3>
                  <p>
                    First (1st) party cookies are stored by a domain (website) you are visiting directly. They allow us
                    to collect analytics data, remember preferred settings (e.g., language, currency, etc.), and perform
                    related functions. Third (3rd) party cookies are created by domains other than those you are
                    visiting directly, hence its name "third (3rd) party." They may be used for cross-tracking,
                    retargeting, and ad-serving.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold">e.) Essential Cookies</h3>
                  <p>
                    Such cookies are technically necessary to provide website functionality. They act as a basic form of
                    memory, used to store the preferences selected by a user on a given website or application. They are
                    essential to browsing functionality and cannot be disabled by users. As an example, an essential
                    cookie may be used to recognize a past user from having to log in each time they visit a new page in
                    the same session.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold">f.) Performance and Function Cookies</h3>
                  <p>
                    Such cookies are used to enhance the performance and functionality of a website but are not
                    essential to its use. However, without these cookies, certain functions (like videos) may become
                    unavailable.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold">g.) Advertising Cookies</h3>
                  <p>
                    Such cookies are used to customize a user's ad experience on a website. When using data collected
                    from cookies, it can prevent the same ad from appearing multiple times in the same session or that
                    does not offer a pleasant experience. Advertising cookies may be used to serve a user with related
                    services, products, or offerings that they may have shown a level of related interest in their past
                    user history.
                  </p>
                </div>
              </div>

              <p className="mt-4">
                If you would like to know more about cookies and how they are used, please visit{" "}
                <a
                  href="https://www.allaboutcookies.org"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  www.allaboutcookies.org
                </a>
                .
              </p>

              <p className="mt-4">
                You can set your browser not to accept cookies, and the above website tells you how to remove cookies
                from your browser. However, in a few cases, some of our website features may not function as a result.
              </p>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-red-600">ADVERTISEMENTS</h2>
              <p className="mb-4">
                Our website has advertisements. You may see advertisements by use of our website. These advertisements
                may be for either 1) our own products, services, offerings, and content 2) via 3rd party advertising
                networks (such as AdSense) or 3) Affiliate programs such as the Amazon.com Associates Central or related
                services. The advertisements presented to you may use your personal information and may contact you
                through other channels outside of the website, such as telephone, e-mail, and mailings. We do not
                disclose your personal information to 3rd party advertisers except as permitted by applicable laws and
                regulations, and we require that such 3rd party advertisers follow such applicable laws and regulations
                when they collect information from you to transfer such information to us.
              </p>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-red-600">HOW WE USE PERSONAL INFORMATION</h2>
              <p className="mb-4">We may use or disclose your Personal Information for the following purpose:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Offerings.</strong> To provide products, services, and offerings that serve the best-matched
                  advertisements.
                </li>
                <li>
                  <strong>Feedback.</strong> To get feedback on website improvements and generally provide an overall
                  better experience.
                </li>
                <li>
                  <strong>Testing.</strong> For testing, research, and analysis, of user behavior on the website.
                </li>
                <li>
                  <strong>Law Enforcement.</strong> To respond to law enforcement requests as required by applicable
                  law, court order, or governmental regulations.
                </li>
                <li>
                  <strong>Intended Purpose.</strong> As described for the intended purpose when collecting your personal
                  information.
                </li>
                <li>
                  <strong>Assessment.</strong> To evaluate or conduct a merger, divestiture, restricting, reorganizing,
                  dissolution, or outright sale, either wholly or partially, of our assets in which your Personal
                  Information becomes a part of such sale.
                </li>
              </ul>
              <p className="mt-4">
                Our usage of your Personal Information may change over time, and when such changes occur, we will update
                this Privacy Policy accordingly.
              </p>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-red-600">SELLING PERSONAL INFORMATION</h2>
              <p className="font-semibold text-green-600">
                Our policy is that we DO NOT sell your personal information. If this should change, you will be notified
                and this Privacy Policy will be updated.
              </p>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-red-600">SHARING PERSONAL INFORMATION</h2>
              <p className="mb-4">
                We disclose your Personal Information to 3rd parties for business purposes. The general categories of
                3rd parties that we share with are as follows:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Our 3rd party service providers that, without their services, our website would not be able to
                  function in its current manner;
                </li>
                <li>
                  Affiliated websites and businesses in an effort to bring you and our users improved services,
                  products, and offerings;
                </li>
                <li>
                  Other companies, affiliate partners, and 3rd parties that help us advertise products, services, and
                  offerings to you, other users, and potential new customers;
                </li>
                <li>
                  Third (3rd) parties to whom you, or an authorized agent on your behalf, authorized us to disclose your
                  Personal Information;
                </li>
                <li>
                  Third (3rd) parties or affiliates in connection with a corporate transaction, such as a sale,
                  consolidation, or merger of our financial institution or affiliated business; and
                </li>
                <li>
                  Other third (3rd) parties to comply with legal requirements or to disclose Personal Information to
                  government authorities per the rule of law.
                </li>
              </ul>
              <p className="mt-4">
                In the last 12 months, it is recognized that we have disclosed the aforementioned categories of Personal
                Information for business purposes.
              </p>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-red-600">RIGHTS AND CHOICES</h2>
              <p className="mb-4">
                This Section describes your rights and choices regarding how we collect, share, use, and protect your
                Personal Information, how to exercise those rights, and limits and exceptions to your rights and
                choices.
              </p>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold">a.) Exceptions</h3>
                  <p>
                    The rights and choices in this Section do not apply to you if the information being collected is:
                  </p>
                  <ul className="list-disc pl-6 mt-2">
                    <li>Aggregate consumer information;</li>
                    <li>Deidentified Personal Information; and</li>
                    <li>Publicly available information.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold">b.) Access to Information</h3>
                  <p className="mb-2">
                    If the above exceptions do not apply, and you have not made this request more than twice in a
                    12-month period, you have the right to request that we disclose certain information to you about our
                    collection and use of your Personal Information over the past 12 months from the date we receive
                    your request. Once we receive and confirm your request on your behalf, we will disclose it to you or
                    your representative:
                  </p>
                  <ul className="list-disc pl-6">
                    <li>The categories of Personal Information we collect;</li>
                    <li>The categories of sources for the Personal Information we collect;</li>
                    <li>Our business or commercial purpose for collecting or selling such Personal Information;</li>
                    <li>
                      The categories of third parties to whom we sold or disclosed the category of Personal Information
                      for a business or commercial purpose;
                    </li>
                    <li>
                      The business or commercial purpose for which we sold or disclosed the category of Personal
                      Information; and
                    </li>
                    <li>
                      The specific pieces of Personal Information we collected about you in a form that you can take
                      with you (also called a "Data Portability Request").
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold">c.) Deletion (Erasure) Request Rights</h3>
                  <p className="mb-2">
                    You have the right to request that we delete any of your Personal Information that we collect from
                    you and retain, subject to certain exceptions. Once we receive and verify your request, we will
                    delete and direct our service providers to delete your Personal Information from our records unless
                    an exception applies. We may deny your deletion request if retaining the Personal Information is
                    necessary for us or our service providers to:
                  </p>
                  <ul className="list-disc pl-6">
                    <li>
                      Complete the transaction for which we collected the Personal Information, provide a good or
                      service that you requested, take actions reasonably anticipated within the context of our ongoing
                      business relationship with you, or otherwise perform our contract with you;
                    </li>
                    <li>
                      Detect security incidents, protect against malicious, deceptive, fraudulent, or illegal activity;
                      or prosecute those for such activity;
                    </li>
                    <li>Debug to identify and repair errors that impair existing intended functionality;</li>
                    <li>Exercise free speech, or exercise another right provided by law;</li>
                    <li>
                      Engage in public or peer-reviewed scientific, historical, or statistical research in the public
                      interest that adheres to all other applicable ethics and privacy laws when the businesses'
                      deletion of the Personal Information is likely to render impossible or seriously impair the
                      achievement of such research if you previously provided informed consent.
                    </li>
                    <li>
                      Enable solely internal and lawful uses of such Personal Information that are compatible with the
                      context in which you provided it.
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-red-600">SECURITY & PROTECTION</h2>
              <p className="mb-4">
                We use reasonable physical, electronic, and procedural safeguards that comply with federal standards to
                protect and limit access to Personal Information. This includes device safeguards used in accordance
                with industry standards.
              </p>
              <p className="mb-4">
                It is understood by you that the Personal Information you submit to us electronically may not be secure
                when it is transmitted to us. Specifically, we recommend that you do not use unsecured or public
                channels to communicate sensitive or confidential information.
              </p>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-red-600">CHANGES AND AMENDMENTS</h2>
              <p>
                We reserve the right to amend this Privacy Policy at our discretion and at any time. When we make
                changes to this Privacy Policy, we agree to notify you by e-mail or other preferred communication
                methods.
              </p>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-red-600">LINKING TO 3RD PARTIES</h2>
              <p>
                We may provide links to 3rd party sources such as websites, applications, content, or software ("3rd
                Parties"). When you use a link online to visit 3rd Parties, you will be subject to their privacy policy
                and the jurisdiction of governing law. It is recommended to familiarize yourself with its terms and
                disclosures regarding your Personal Information. We are not responsible for the handling of your
                Personal Information when using, accessing, or visiting 3rd Parties.
              </p>
            </section>

            <Separator className="my-6" />

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-red-600">CONTACT</h2>
              <p className="mb-4">
                If you have any questions or comments about this Privacy Policy, the ways in which we collect and use
                your Personal Information, your choices, or your rights regarding such use, or wish to exercise your
                rights, please do not hesitate to contact us by using the details mentioned in this Privacy Policy.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="font-semibold mb-2">Contact Information:</p>
                <p>
                  <strong>Email:</strong>{" "}
                  <a href="mailto:aaronhirshka@gmail.com" className="text-blue-600 hover:underline">
                    aaronhirshka@gmail.com
                  </a>
                </p>
                <p>
                  <strong>Phone:</strong>{" "}
                  <a href="tel:7246818176" className="text-blue-600 hover:underline">
                    724-681-8176
                  </a>
                </p>
                <p>
                  <strong>Address:</strong> 2366 Morton St, Pittsburgh, Pennsylvania, 15234
                </p>
              </div>
            </section>

            <div className="text-center text-sm text-gray-500 mt-8 pt-8 border-t">
              <p>Last updated: June 23, 2025</p>
              <p>© 2025 JustTheDamnRecipe. All rights reserved.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
