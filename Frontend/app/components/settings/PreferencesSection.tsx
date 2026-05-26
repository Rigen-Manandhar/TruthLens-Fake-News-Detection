import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import {
  NEWS_CATEGORY_OPTIONS,
  type DetectionExplanationMode,
  type DetectionInputMode,
  type UserPreferences,
} from "@/lib/shared/settings";

type PreferencesSectionProps = {
  prefs: UserPreferences;
  savingPrefs: boolean;
  onPrefsChange: (prefs: UserPreferences) => void;
  onSave: () => void;
};

export default function PreferencesSection({
  prefs,
  savingPrefs,
  onPrefsChange,
  onSave,
}: PreferencesSectionProps) {
  return (
    <div className="min-w-0 rounded-3xl bg-(--surface)/90 border border-(--line) p-5 sm:p-6 space-y-4">
      <h2 className="display-title text-2xl text-(--foreground-strong)">Preferences</h2>
      <Input
        label="Default country (2-letter)"
        id="newsCountry"
        value={prefs.newsCountry}
        onChange={(e) =>
          onPrefsChange({
            ...prefs,
            newsCountry: e.target.value.toLowerCase().slice(0, 2),
          })
        }
      />
      <div className="flex flex-wrap gap-2">
        {NEWS_CATEGORY_OPTIONS.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() =>
              onPrefsChange({
                ...prefs,
                newsCategories: prefs.newsCategories.includes(category)
                  ? prefs.newsCategories.filter((value) => value !== category)
                  : [...prefs.newsCategories, category],
              })
            }
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
              prefs.newsCategories.includes(category)
                ? "bg-(--ink) text-(--ink-foreground) border-(--ink)"
                : "bg-(--surface-strong) text-(--muted-foreground) border-(--line)"
            }`}
          >
            {category}
          </button>
        ))}
      </div>
      <Select
        label="Detection input mode"
        id="detectionInputMode"
        value={prefs.detectionInputMode}
        onChange={(e) =>
          onPrefsChange({
            ...prefs,
            detectionInputMode: e.target.value as DetectionInputMode,
          })
        }
      >
        <option value="auto">Auto</option>
        <option value="headline_only">Headline only</option>
        <option value="full_article">Full article</option>
        <option value="headline_plus_article">Headline + article</option>
      </Select>
      <Select
        label="Explanation mode"
        id="detectionExplanationMode"
        value={prefs.detectionExplanationMode}
        onChange={(e) =>
          onPrefsChange({
            ...prefs,
            detectionExplanationMode: e.target.value as DetectionExplanationMode,
          })
        }
      >
        <option value="auto">Auto explanation</option>
        <option value="none">No explanation</option>
      </Select>
      <Button
        type="button"
        onClick={onSave}
        disabled={savingPrefs}
        className="w-auto px-6"
      >
        {savingPrefs ? "Saving..." : "Save preferences"}
      </Button>
    </div>
  );
}
