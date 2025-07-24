import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { ArrowLeft, Mail, Phone, MapPin } from "lucide-react"

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Terms and Conditions</CardTitle>
            <div className="text-center text-muted-foreground">
              <p>Effective Date: June 24, 2025</p>
              <p>Last Updated: June 24, 2025</p>
            </div>
          </CardHeader>

          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-blue-600 mb-3">Agreement to Terms</h2>
              <p>
                The Terms of Use Agreement ("Agreement"), created on the effective date and last amended on date above,
                is made between you ("user," "you" or "your"), and the website owner outlined below.
              </p>
            </section>

            <section className="bg-blue-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-blue-600 mb-3">Website Owner</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p>
                    <strong>Website URL:</strong> www.justthedamnrecipe.net
                  </p>
                  <p>
                    <strong>Individual's Name:</strong> Aaron Hirshka
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>2366 Morton St, Pittsburgh, Pennsylvania, 15234</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <a href="mailto:aaronhirshka@gmail.com" className="text-blue-600 hover:underline">
                      aaronhirshka@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <a href="tel:7246818176" className="text-blue-600 hover:underline">
                      (724) 681-8176
                    </a>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-blue-600 mb-3">Access</h2>
              <p>
                Your access to and use of the website and the services is conditional upon your acceptance of and
                compliance with this Agreement, which applies to all the website's visitors. If for any reason, you do
                not agree with any of the terms of this Agreement, you may not access the website or its services.
              </p>

              <div className="mt-4 space-y-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">Minors (under the age of 18)</h3>
                  <p className="text-yellow-700">
                    If any user is a minor in the jurisdiction where they reside, the minor must obtain permission from
                    their parent or guardian to use the website. If a minor accesses the website, it is assumed that
                    their parent or guardian has read and agrees to this Agreement and has given permission to the minor
                    to use the website.
                  </p>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">Children (under the age of 13)</h3>
                  <p className="text-red-700">
                    If any user is a child under the age of thirteen (13) years and from the United States, it is
                    assumed that they have obtained permission and verifiable parental consent to use the website.
                    Furthermore, this Agreement allows the protections mentioned under the Children's Online Privacy
                    Protection, specifically, 15 U.S. Code § 6502.
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-blue-600 mb-3">Prohibited Activities</h2>
              <p className="mb-4">
                As a user of our services, whether on the website or mobile app, it is prohibited to engage in the
                following activities:
              </p>

              <div className="bg-gray-50 p-4 rounded-lg">
                <ul className="space-y-2 text-sm">
                  <li>
                    • Systematically retrieve data or other content from the website to create compilations without
                    written permission
                  </li>
                  <li>• Trick, defraud, or mislead other users, especially to learn sensitive account information</li>
                  <li>• Circumvent, disable, or interfere with security-related features of the website</li>
                  <li>• Disparage, tarnish, or otherwise harm the Company, website, or mobile app</li>
                  <li>• Use information obtained from the website to harass, abuse, or harm another person</li>
                  <li>• Make improper use of support services or make false reports of abuse</li>
                  <li>• Use the website in a manner inconsistent with its intended use or against applicable laws</li>
                  <li>• Engage in spamming, linking, or referring to other websites for commercial purposes</li>
                  <li>• Upload or transmit viruses, trojan horses, or other damaging material</li>
                  <li>• Attempt unauthorized automated use of the website using scripts or bots</li>
                  <li>• Delete copyrights, trademarks, or other proprietary marks from content</li>
                  <li>• Impersonate another user or person</li>
                  <li>• Interfere with, disrupt, or create undue burden on the website or services</li>
                  <li>• Harass, annoy, intimidate, or threaten other users or employees</li>
                  <li>• Copy or adapt the software of the website</li>
                  <li>• Use the website for any revenue-generating endeavor without authorization</li>
                  <li>• Sell your user profile or account on the website</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-blue-600 mb-3">Guidelines for Reviews</h2>
              <p className="mb-4">
                We may provide you the right to leave a review or rating of the services provided. Said review or rating
                requires that you:
              </p>

              <div className="bg-green-50 p-4 rounded-lg">
                <ul className="space-y-2 text-sm text-green-800">
                  <li>• Should have firsthand experience with the person/entity being reviewed</li>
                  <li>• Do not contain offensive, abusive, racist, or profanity-laden language</li>
                  <li>
                    • Do not reference discriminatory language related to religion, race, gender, national origin, age,
                    marital status, sexual orientation, or disability
                  </li>
                  <li>• Do not include references to illegal activity</li>
                  <li>• Do not post negative reviews as part of a scheme with competitors</li>
                  <li>• Do not make suggestions about the legality of our services</li>
                  <li>• Do not post false or misleading comments about your experience</li>
                  <li>• Do not organize campaigns encouraging others to post reviews</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-blue-600 mb-3">Copyright Policy</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Intellectual Property Infringement</h3>
                  <p>
                    It is our duty to respect the intellectual property rights of others. Therefore, it is our policy to
                    respond to any claim that infringes on any trademark, copyright, or other intellectual property
                    protected under law.
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">DMCA Notice and Procedure</h3>
                  <p className="text-blue-700 mb-2">
                    You may submit a notification pursuant to the Digital Millennium Copyright Act (DMCA) by providing
                    our Company with the following information in writing:
                  </p>
                  <ul className="space-y-1 text-sm text-blue-700">
                    <li>• Electronic or physical signature of the copyright owner</li>
                    <li>• Description of the copyrighted work that has been infringed</li>
                    <li>• Your contact details including name, address, phone number, and email</li>
                    <li>• Statement that the infringement is not authorized and request is in good faith</li>
                    <li>• Statement under penalty of perjury that the information is accurate</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-blue-600 mb-3">Intellectual Property</h2>
              <p>
                Except as otherwise indicated, all source coding, databases, functionalities, software, graphic designs,
                and media of any kind (e.g. audio, video, text, photos, etc.), content, trademarks, service marks,
                logos, and copyrights are considered to be intellectual and proprietary information ("intellectual
                property"). Such intellectual information is under our ownership and protected by local, state,
                national, and international laws and will be defended.
              </p>

              <div className="bg-red-50 p-4 rounded-lg mt-4">
                <p className="text-red-700 font-semibold">
                  No intellectual property is permitted to be copied, reproduced, aggregated, republished, uploaded,
                  posted, publicly displayed, encoded, translated, transmitted, distributed, sold, licensed, or
                  otherwise exploited for commercial purposes without our express prior written permission.
                </p>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-blue-600 mb-3">User Obligations</h2>
              <p className="mb-4">You, as a user of the website or any of its services, agree to the following:</p>

              <div className="bg-gray-50 p-4 rounded-lg">
                <ul className="space-y-2 text-sm">
                  <li>• Any information used for registration purposes must be submitted accurately and completely</li>
                  <li>
                    • If any information should change regarding your account, you agree to change it in a timely
                    fashion
                  </li>
                  <li>• You have the legal capacity to understand, agree with, and comply with this Agreement</li>
                  <li>
                    • You are not considered a minor in the jurisdiction where you reside or are accessing the website
                  </li>
                  <li>• You will not access the website through bots, scripts, or any other unauthorized manner</li>
                  <li>• You will use the website and its services in an authorized and legal manner</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-blue-600 mb-3">User Accounts</h2>
              <p>
                If our website allows the creation of a user account of any type, you agree to be responsible for
                safeguarding its information including account data, connected emails, passwords, and any other personal
                information located therein. If you are made aware of any breach of unauthorized use of the account,
                notify us as soon as possible.
              </p>

              <div className="bg-yellow-50 p-4 rounded-lg mt-4">
                <p className="text-yellow-700">
                  <strong>Username Requirements:</strong> If the creation of a username is allowed when making an
                  account, such username must be appropriate for public viewing and not violate any trademark,
                  copyright, or other protected names or marks.
                </p>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-blue-600 mb-3">Social Media</h2>
              <p>
                As part of the website's functionality, you may be able to link and connect a social media profile with
                your account for sharing information, logging into the website, or for any other reason that is in
                accordance with the terms of this Agreement and the social media Company's terms of use.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-blue-600 mb-3">User Submissions & Content</h2>
              <p className="mb-4">
                You acknowledge and agree that any questions, comments, suggestions, ideas, feedback, or other
                information regarding the website ("submissions") provided by you is public and is not considered
                confidential unless otherwise stated.
              </p>

              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-orange-700 font-semibold">
                  Upon submissions posted on the website, it becomes our exclusive property along with all intellectual
                  property rights which may be used by us for any lawful purpose, commercial or otherwise, and without
                  acknowledgment or compensation to you.
                </p>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-blue-600 mb-3">Third Party Websites and Content</h2>
              <p>
                Our website or services may contain links to 3rd party websites or services that are not owned or
                controlled by us. Therefore, we assume no responsibility for the content, privacy policies, terms of
                use, practices, services, experiences, activities, or any other acts by 3rd parties.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-blue-600 mb-3">Advertising</h2>
              <p>
                In the event that we host, display, recommend, or link to websites or services in exchange for a fee
                ("advertisements"), it shall be known that such websites and services are often not known to us and are
                provided via advertisement networks based on user data.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-blue-600 mb-3">Site Management</h2>
              <p className="mb-4">
                To ensure the best experience for all users of our website and services, we reserve the right, in our
                sole discretion, to:
              </p>

              <div className="bg-gray-50 p-4 rounded-lg">
                <ul className="space-y-2 text-sm">
                  <li>• Monitor our website, services, and content for violations by users of this Agreement</li>
                  <li>• Take appropriate actions against users who may have violated this Agreement</li>
                  <li>
                    • Refuse, restrict, limit, disable, or remove files and Content that are burdensome to our systems
                  </li>
                  <li>• Otherwise manage our website and services to protect our rights and property</li>
                </ul>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-blue-600 mb-3">Privacy Policy</h2>
              <p>
                Your access to and use of our website or services is conditional upon your acceptance of our privacy
                policy. Our privacy policy describes our rules and procedures on the collection, use, and disclosure of
                your personal information and details your privacy rights and how the law protects you and such data.
              </p>

              <div className="mt-4">
                <Link href="/privacy">
                  <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                    Read Our Privacy Policy
                  </Button>
                </Link>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-blue-600 mb-3">Termination</h2>
              <p>
                We may terminate or suspend your account for any reason and at our sole discretion. If your account is
                suspended or terminated, we may or may not provide prior notice. Upon termination, your access to the
                website and/or services will cease immediately.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-blue-600 mb-3">Governing Law</h2>
              <p>
                The laws governing the Company's jurisdiction mentioned herein shall govern this Agreement, including
                your use and access to the website and services. Your use of this website, services, and any mobile app
                may be subject to other local, state, national, and international laws.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-blue-600 mb-3">Dispute Resolution</h2>
              <p className="mb-4">
                If you should raise any dispute about the website, its content, or any of the services offered, it is
                required first to attempt to resolve the dispute formally by contacting us.
              </p>

              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Mediation</h3>
                  <p className="text-blue-700">
                    If a dispute cannot be agreed upon by the parties, it shall be moved to mediation for a period of 30
                    days with at least 10 hours to be committed by each party in accordance with the procedures of the
                    United States Arbitration & Mediation. All costs related to said mediation shall be shared equally
                    by both parties.
                  </p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-2">Arbitration</h3>
                  <p className="text-purple-700">
                    If the dispute cannot be agreed upon during the mediation period, then the dispute will be submitted
                    to binding arbitration in the jurisdiction of governing law.
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-blue-600 mb-3">"As-Is" Disclaimer</h2>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-red-700 font-semibold mb-2">
                  It is recognized to you, as a user of the website and any services offered, that they are provided on
                  an "as-is," "where is," and "as available" basis, including faults and defects without warranty.
                </p>
                <p className="text-red-600 text-sm">
                  To the maximum extent permitted under applicable law, the Company expressly disclaims all warranties,
                  whether express, implied, statutory, or otherwise, with respect to the said website and any services
                  offered.
                </p>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-blue-600 mb-3">Indemnification</h2>
              <p>
                You agree to defend, indemnify, and hold us harmless, including any of our subsidiaries, agents, or
                affiliates and our respective officers, agents, partners, and employees, from and against any loss,
                damage, liability, claim, or demand, including reasonable attorneys' fees and expenses, made by any 3rd
                party due to or arising out of your use of the website or any breach of this Agreement.
              </p>
            </section>

            <Separator />

            <section className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-blue-600 mb-3">Contact Information</h2>
              <p className="mb-4">
                Except as explicitly stated otherwise, any notices sent to us must be sent to the contact information
                below:
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <a href="mailto:aaronhirshka@gmail.com" className="text-blue-600 hover:underline">
                      aaronhirshka@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <a href="tel:7246818176" className="text-blue-600 hover:underline">
                      (724) 681-8176
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1" />
                  <span>
                    2366 Morton St
                    <br />
                    Pittsburgh, Pennsylvania, 15234
                  </span>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-blue-600 mb-3">Special Provisions</h2>

              <div className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">California Users</h3>
                  <p className="text-yellow-700 text-sm">
                    If any complaint with us is not satisfactorily resolved, you can contact the Complaint Assistance
                    Unit of the Division of Consumer Services of the California Department of Consumer Affairs at 1625
                    North Market Blvd, Suite N 112, Sacramento, California 95834, or by phone at (800) 952-5210.
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">U.S. Federal Government End-Users</h3>
                  <p className="text-blue-700 text-sm">
                    If you are a user acting on behalf of the U.S. federal government, our website and its services are
                    treated as a "commercial item" as defined under 48 C.F.R. § 2.101.
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">European Union (EU) Users</h3>
                  <p className="text-green-700 text-sm">
                    If you are a European Union (EU) resident, consumer, or user, it is recognized that you are entitled
                    to specific protections on how your personal information is collected. We, in our privacy policy,
                    attempt to be in accordance with such rules and regulations.
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-blue-600 mb-3">Miscellaneous</h2>
              <p>
                This Agreement and any policies or operating rules posted by us, on the website, or through any services
                constitute the entire Agreement and understanding between you, as a user, and us, as a Company. Our
                failure to exercise or enforce any right or provision of this Agreement will not operate as a waiver of
                such right or provision.
              </p>

              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <p className="text-gray-700 text-sm">
                  If any provision, section, clause, or part of this Agreement is determined to be unlawful, void, or
                  unenforceable, that said portion of this Agreement is determined to be severable and does not affect
                  the validity and enforceability of any remaining language.
                </p>
              </div>
            </section>

            <div className="text-center pt-8 border-t">
              <p className="text-sm text-muted-foreground">
                If this Agreement has been translated, you agree that its original English text shall prevail in the
                case of a dispute.
              </p>
              <div className="mt-4">
                <Link href="/">
                  <Button>Return to Home</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
