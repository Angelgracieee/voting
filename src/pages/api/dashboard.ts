import type { NextApiRequest, NextApiResponse } from "next";
import { readSheetValues } from "@/lib/sheets";

function clean(v: unknown) {
  return String(v ?? "").trim();
}

function formatAsOf(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const sheetName = process.env.SHEET_TAB_NAME ?? "Form Responses 1";
    const values = await readSheetValues(`${sheetName}!A:AZ`);

    if (values.length < 2) {
      return res.status(200).json({
        asOf: "—",
        totalResponses: 0,
        ranking: [],
        respondents: [],
      });
    }

    const headers = values[0].map(clean);
    const rows = values.slice(1);

    const iTimestamp = headers.findIndex((h) => clean(h) === "Timestamp");
    const iName = headers.findIndex((h) => clean(h) === "Name:");
    const iSchool = headers.findIndex((h) => clean(h) === "Name of School:");
    const iSchoolAddress = headers.findIndex(
      (h) => clean(h) === "School Address:"
    );
    const iSchoolType = headers.findIndex((h) => clean(h) === "School Type");
    const iSchoolLevel = headers.findIndex((h) =>
      clean(h).startsWith("Type of School Level Offered")
    );
    const iPrincipal = headers.findIndex(
      (h) => clean(h) === "Name of the School Principal:"
    );
    const iCoordinator = headers.findIndex(
      (h) => clean(h) === "Name of the Sports Head / Coordinator:"
    );
    const iContact = headers.findIndex((h) =>
      clean(h).startsWith("Contact Number:")
    );
    const iEmail = headers.findIndex((h) => clean(h) === "Email Address:");

    const sportStartIndex = iEmail + 1;

    const sportColumns = headers
      .map((header, index) => ({ header: clean(header), index }))
      .filter(
        ({ index, header }) =>
          index >= sportStartIndex &&
          header !== "" &&
          !header.toLowerCase().includes("untitled")
      );

    const getMainSportName = (header: string) => {
      return header.split("\n")[0].trim();
    };

    const subcategoryCounts: Record<string, number> = {};
    let latestTs = "";

    const respondents = rows.map((r) => {
      const ts = clean(r[iTimestamp]);

      if (ts) {
        if (!latestTs) latestTs = ts;
        else {
          const a = new Date(latestTs).getTime();
          const b = new Date(ts).getTime();
          if (!isNaN(a) && !isNaN(b) && b > a) latestTs = ts;
        }
      }

      const selectedSports: string[] = [];
      const selectedDetails: string[] = [];

      for (const { header, index } of sportColumns) {
        const rawValue = clean(r[index]);
        if (!rawValue) continue;

        const sportName = getMainSportName(header);

        // Split checkbox answers by comma
        const parts = rawValue
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean);

        for (const part of parts) {
          const key = `${sportName} - ${part}`;
          subcategoryCounts[key] = (subcategoryCounts[key] ?? 0) + 1;
          selectedSports.push(key);
          selectedDetails.push(key);
        }
      }

      return {
        timestamp: ts,
        name: clean(r[iName]),
        school: clean(r[iSchool]),
        schoolAddress: clean(r[iSchoolAddress]),
        schoolType: clean(r[iSchoolType]),
        schoolLevel: clean(r[iSchoolLevel]),
        principal: clean(r[iPrincipal]),
        coordinator: clean(r[iCoordinator]),
        contact: clean(r[iContact]),
        email: clean(r[iEmail]),
        selectedSports,
        selectedDetails,
      };
    });

    const ranking = Object.entries(subcategoryCounts)
      .map(([sport, votes]) => ({ sport, votes }))
      .sort((a, b) => b.votes - a.votes || a.sport.localeCompare(b.sport));

    return res.status(200).json({
      asOf: latestTs ? formatAsOf(latestTs) : "—",
      totalResponses: respondents.length,
      ranking,
      respondents,
    });
  } catch (e: any) {
    return res.status(500).json({
      error: e?.message ?? "Server error",
    });
  }
}