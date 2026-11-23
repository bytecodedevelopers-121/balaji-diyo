import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PackageDetail } from "@/app/[slug]/data";
import { splitHtmlBlocks } from "@/features/trips/lib/map-package-detail";
import { footerOffices } from "@/config/navigation";

/**
 * The downloadable trip brochure — a React-PDF equivalent of the one the
 * live production site generates from its own `/api/brochure` route (see
 * `route.ts` in this folder for how that was reverse-engineered: same
 * request shape, same `@react-pdf/renderer` library — its PDF's
 * `/Producer` metadata literally reads "react-pdf" — same A4 page size,
 * same plain-Helvetica look with no custom font registered, same
 * "© <year> Boundless Adventure..." / "Page X / Y" running footer on
 * every page). Not a pixel-for-pixel clone of that PDF's exact copy or
 * page count — this draws from `PackageDetail`, the shape this repo's
 * package-detail page already renders, so cover, overview, day-by-day
 * itinerary, and includes/excludes all come from the same real data the
 * page shows, with no separate content to keep in sync.
 */

const COLORS = {
  primary: "#ff6b1a",
  ink: "#1a1a1a",
  muted: "#5b5b5b",
  border: "#e2e2e2",
  panel: "#f7f7f7",
  include: "#1a8f4c",
  exclude: "#d1382f",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 40,
    fontSize: 10,
    color: COLORS.ink,
    fontFamily: "Helvetica",
  },
  runningHeader: {
    position: "absolute",
    top: 20,
    left: 40,
    right: 40,
    textAlign: "right",
    fontSize: 8,
    color: COLORS.muted,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: COLORS.muted,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    paddingTop: 6,
  },
  coverImage: {
    width: "100%",
    height: 220,
    objectFit: "cover",
    borderRadius: 4,
  },
  coverImageFallback: {
    width: "100%",
    height: 220,
    backgroundColor: COLORS.panel,
    borderRadius: 4,
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    marginTop: 18,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.6,
    color: COLORS.muted,
    marginTop: 10,
  },
  factsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 20,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    paddingTop: 16,
  },
  factCell: {
    width: "33.33%",
    marginBottom: 14,
  },
  factLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: COLORS.muted,
  },
  factValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 3,
  },
  sectionHeading: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 10,
  },
  bulletRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  bulletMark: {
    width: 12,
    fontSize: 10,
    color: COLORS.primary,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.5,
    color: COLORS.ink,
  },
  dayBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  dayBadge: {
    fontSize: 9,
    color: COLORS.muted,
    backgroundColor: COLORS.panel,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 3,
  },
  dayLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  dayTitle: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    marginTop: 4,
  },
  twoColumn: {
    flexDirection: "row",
  },
  column: {
    flex: 1,
  },
  columnLeft: {
    paddingRight: 12,
  },
  columnRight: {
    paddingLeft: 12,
  },
  categoryHeading: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginTop: 12,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    paddingVertical: 6,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: COLORS.panel,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableCellLeft: {
    flex: 2,
    fontSize: 9,
  },
  tableCellRight: {
    flex: 1,
    fontSize: 9,
    textAlign: "right",
  },
});

function Footer() {
  const nepalOffice = footerOffices[0];
  return (
    <View style={styles.footer} fixed>
      <Text>
        © {new Date().getFullYear()} Your Company Pvt. Ltd.. All rights reserved.
      </Text>
      <Text>
        {nepalOffice?.email} | {nepalOffice?.phones[0]?.label}
      </Text>
      <Text
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}

function RunningHeader({ title }: { title: string }) {
  return (
    <Text style={styles.runningHeader} fixed>
      {title}
    </Text>
  );
}

export function BrochureDocument({ trip }: { trip: PackageDetail }) {
  const heroImage = trip.heroImages[0];
  const days = trip.detailedItinerary.flatMap((leg) => leg.days);
  const durationFact = trip.quickFacts.find((fact) => /duration/i.test(fact.label));

  return (
    <Document
      title={`${trip.title} — Your Company Pvt. Ltd.`}
      author="Your Company Pvt. Ltd."
      creator="Your Company Pvt. Ltd."
      subject={`Trip brochure for ${trip.title}`}
    >
      {/* Cover */}
      <Page size="A4" style={styles.page}>
        {heroImage ? (
          // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's own <Image>, not an HTML <img>; it has no alt prop.
          <Image src={heroImage} style={styles.coverImage} />
        ) : (
          <View style={styles.coverImageFallback} />
        )}
        <Text style={styles.title}>{trip.title}</Text>
        {durationFact ? <Text style={styles.subtitle}>{durationFact.value}</Text> : null}
        <Text style={styles.paragraph}>{trip.intro}</Text>

        <View style={styles.factsGrid}>
          {trip.quickFacts.map((fact) => (
            <View key={fact.label} style={styles.factCell}>
              <Text style={styles.factLabel}>{fact.label}</Text>
              <Text style={styles.factValue}>{fact.value}</Text>
            </View>
          ))}
        </View>

        <Footer />
      </Page>

      {/* Overview */}
      <Page size="A4" style={styles.page}>
        <RunningHeader title={trip.title} />
        <Text style={styles.sectionHeading}>Trip Overview</Text>
        {splitHtmlBlocks(trip.overview).map((paragraph, index) => (
          <Text key={index} style={styles.paragraph}>
            {paragraph}
          </Text>
        ))}

        {trip.highlights.length > 0 ? (
          <>
            <Text style={[styles.sectionHeading, { marginTop: 24 }]}>Highlights</Text>
            {trip.highlights.map((highlight, index) => (
              <View key={index} style={styles.bulletRow}>
                <Text style={styles.bulletMark}>•</Text>
                <Text style={styles.bulletText}>{highlight}</Text>
              </View>
            ))}
          </>
        ) : null}

        <Footer />
      </Page>

      {/* Day-by-day itinerary — one page per day, matching production's layout */}
      {days.map((day) => (
        <Page key={day.day} size="A4" style={styles.page}>
          <RunningHeader title={trip.title} />
          <Text style={styles.dayLabel}>Day {String(day.day).padStart(2, "0")}</Text>
          <Text style={styles.dayTitle}>{day.title}</Text>

          <View style={styles.dayBadgeRow}>
            {day.altitudeM ? (
              <Text style={styles.dayBadge}>Altitude: {day.altitudeM.toLocaleString()}m</Text>
            ) : null}
            {day.durationHours > 0 ? (
              <Text style={styles.dayBadge}>Duration: ~{day.durationHours} hrs</Text>
            ) : null}
            {day.distanceKm !== undefined ? (
              <Text style={styles.dayBadge}>Distance: {day.distanceKm} km</Text>
            ) : null}
            {day.accommodation ? (
              <Text style={styles.dayBadge}>Stay: {day.accommodation}</Text>
            ) : null}
            {day.meals ? <Text style={styles.dayBadge}>Meals: {day.meals}</Text> : null}
          </View>

          <Text style={styles.paragraph}>{day.description}</Text>

          {/* First *photo* only — a day's video (day.photos can hold at most one) has no still frame to embed in a PDF. */}
          {day.photos?.find((p) => p.type === "image") ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's own <Image>, not an HTML <img>; it has no alt prop.
            <Image
              src={day.photos.find((p) => p.type === "image")!.url}
              style={[styles.coverImage, { height: 180, marginTop: 16 }]}
            />
          ) : null}

          <Footer />
        </Page>
      ))}

      {/* Cost includes / excludes */}
      <Page size="A4" style={styles.page}>
        <RunningHeader title={trip.title} />
        <Text style={styles.sectionHeading}>Cost</Text>

        <View style={styles.tableHeaderRow}>
          <Text style={styles.tableCellLeft}>Group Size</Text>
          <Text style={styles.tableCellRight}>Price / Person</Text>
        </View>
        {trip.costTiers.map((tier) => (
          <View key={tier.groupSize} style={styles.tableRow}>
            <Text style={styles.tableCellLeft}>{tier.groupSize}</Text>
            <Text style={styles.tableCellRight}>USD {tier.pricePerPerson.toLocaleString()}</Text>
          </View>
        ))}

        <View style={[styles.twoColumn, { marginTop: 24 }]}>
          <View style={[styles.column, styles.columnLeft]}>
            <Text style={[styles.sectionHeading, { fontSize: 12, color: COLORS.include }]}>
              What&apos;s Included
            </Text>
            {trip.includes.map((group) => (
              <View key={group.category}>
                <Text style={styles.categoryHeading}>{group.category}</Text>
                {group.items.map((item, index) => (
                  <View key={index} style={styles.bulletRow}>
                    <Text style={[styles.bulletMark, { color: COLORS.include }]}>✓</Text>
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          <View style={[styles.column, styles.columnRight]}>
            <Text style={[styles.sectionHeading, { fontSize: 12, color: COLORS.exclude }]}>
              What&apos;s Excluded
            </Text>
            {trip.excludes.map((group) => (
              <View key={group.category}>
                <Text style={styles.categoryHeading}>{group.category}</Text>
                {group.items.map((item, index) => (
                  <View key={index} style={styles.bulletRow}>
                    <Text style={[styles.bulletMark, { color: COLORS.exclude }]}>✕</Text>
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>

        <Footer />
      </Page>
    </Document>
  );
}
