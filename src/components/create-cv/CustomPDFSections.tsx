import React from "react";
import { Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import type { CVCustomSection } from "@/types";

export default function CustomPDFSections({ sections = [], titleStyle, textStyle }: {
  sections?: CVCustomSection[]; titleStyle?: Style; textStyle?: Style;
}) {
  return <>{sections.filter(section => section.title.trim() || section.content.trim()).map(section =>
    <View key={section.id} style={{ marginTop: 12, marginBottom: 8 }}>
      {section.title.trim() && <Text minPresenceAhead={24} style={titleStyle}>{section.title}</Text>}
      {section.content.split(/\r?\n/).map((line, index) => line.trim()
        ? <Text key={index} orphans={2} widows={2} style={[textStyle || {}, { flex: undefined, lineHeight: 1.5 }]}>{line}</Text>
        : <View key={index} style={{ height: 5 }} />)}
    </View>
  )}</>;
}
