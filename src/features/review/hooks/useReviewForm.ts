import { useEffect, useRef, useState } from "react";
import { NON_GOCHIMESHI_MARKER_VARIANT } from "@/components/google-maps/constants";
import { useMapMarkerStore } from "@/stores";
import {
  createReviewForExistingPlaceAction,
  createReviewWithPlaceAction,
  findPlaceIdByGooglePlaceIdAction,
  type ExistingReviewPlaceMatch,
} from "@/features/review/actions";
import { useTagSelection } from "@/features/tag/hooks/useTagSelection";
import type {
  GooglePlacePhotoAttribution,
  GooglePlaceSuggestion,
  SignedGooglePlaceDetails,
} from "@/features/places/googlePlaces";
import type { TagGroup } from "@/features/tag/types";

export type ReviewFormMode = "new-place" | "existing-place";

export interface ReviewFormPlaceInfo {
  id: string;
  googlePlaceId?: string;
  name: string;
  address: string | null;
  sessionToken?: string;
  selectionSignature?: string;
  lat?: number;
  lng?: number;
  types?: string[];
  primaryType?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  photoAttributions?: GooglePlacePhotoAttribution[];
  distanceFromOfficeMeters?: number | null;
  walkingDurationSeconds?: number | null;
}

type SelectedPlaceInfo = SignedGooglePlaceDetails;

type UseReviewFormOptions = {
  mode: ReviewFormMode;
  place?: ReviewFormPlaceInfo;
  tagGroups?: TagGroup[];
  onExistingPlaceMatch?: (place: ExistingReviewPlaceMatch) => void;
};

function createSessionToken() {
  return crypto.randomUUID();
}

function formatDateInput(date: Date | undefined): string | null {
  if (!date) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function hasSelectedPlaceDetails(
  place: ReviewFormPlaceInfo | SelectedPlaceInfo | undefined
): place is SelectedPlaceInfo {
  return Boolean(
    place?.googlePlaceId &&
    place.sessionToken &&
    place.selectionSignature &&
    place.primaryType &&
    place.category &&
    Array.isArray(place.photoAttributions) &&
    typeof place.lat === "number" &&
    typeof place.lng === "number" &&
    Number.isFinite(place.lat) &&
    Number.isFinite(place.lng)
  );
}

export function useReviewForm({
  mode,
  place: initialPlace,
  tagGroups = [],
  onExistingPlaceMatch,
}: UseReviewFormOptions) {
  const setMapMarkers = useMapMarkerStore((state) => state.setMarkers);
  const clearMapMarkers = useMapMarkerStore((state) => state.clearMarkers);
  const selectMapMarker = useMapMarkerStore((state) => state.selectMarker);
  const placeDetailsAbortRef = useRef<AbortController | null>(null);
  const isNewPlaceMode = mode === "new-place";
  const [selectedPlace, setSelectedPlace] = useState<
    ReviewFormPlaceInfo | SelectedPlaceInfo | undefined
  >(initialPlace);
  const [placeSearchInput, setPlaceSearchInput] = useState(initialPlace?.name ?? "");
  const [placeSuggestions, setPlaceSuggestions] = useState<GooglePlaceSuggestion[]>([]);
  const [placeSessionToken, setPlaceSessionToken] = useState(createSessionToken);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [placeSearchError, setPlaceSearchError] = useState<string | null>(null);
  const [isLoadingPlaceDetails, setIsLoadingPlaceDetails] = useState(false);
  const [placeDetailsError, setPlaceDetailsError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [visitDate, setVisitDate] = useState<Date | undefined>();
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [priceRange, setPriceRange] = useState<number | null>(null);
  const { selectedTags, handleTagToggle } = useTagSelection();
  const [isPending, setIsPending] = useState(false);
  const [existingPlaceMatch, setExistingPlaceMatch] = useState<ExistingReviewPlaceMatch | null>(
    null
  );

  useEffect(() => {
    return () => {
      placeDetailsAbortRef.current?.abort();
      clearMapMarkers("review-place");
    };
  }, [clearMapMarkers]);

  useEffect(() => {
    const normalizedInput = placeSearchInput.trim();

    if (!isNewPlaceMode || selectedPlace || normalizedInput.length < 2) {
      return;
    }

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsSearchingPlaces(true);
      setPlaceSearchError(null);

      try {
        const response = await fetch("/api/google-places/autocomplete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            input: normalizedInput,
            sessionToken: placeSessionToken,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to load place suggestions.");
        }

        const data = (await response.json()) as { suggestions?: GooglePlaceSuggestion[] };

        setPlaceSuggestions(data.suggestions ?? []);
      } catch {
        if (abortController.signal.aborted) {
          return;
        }

        setPlaceSuggestions([]);
        setPlaceSearchError("お店の候補を取得できませんでした。");
      } finally {
        if (!abortController.signal.aborted) {
          setIsSearchingPlaces(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [isNewPlaceMode, placeSearchInput, placeSessionToken, selectedPlace]);

  const setPlaceSearch = (value: string) => {
    placeDetailsAbortRef.current?.abort();
    setPlaceSearchInput(value);
    setPlaceDetailsError(null);
    setIsLoadingPlaceDetails(false);
    setExistingPlaceMatch(null);

    if (selectedPlace) {
      setSelectedPlace(undefined);
      setPlaceSessionToken(createSessionToken());
      clearMapMarkers("review-place");
    }

    if (value.trim().length < 2) {
      setPlaceSuggestions([]);
      setIsSearchingPlaces(false);
      setPlaceSearchError(null);
    }
  };

  const clearSelectedPlaceForSearch = () => {
    placeDetailsAbortRef.current?.abort();
    setSelectedPlace(undefined);
    setExistingPlaceMatch(null);
    setPlaceDetailsError(null);
    setIsLoadingPlaceDetails(false);
    setPlaceSessionToken(createSessionToken());
    clearMapMarkers("review-place");
    setErrors((currentErrors) => {
      const { place, submit, ...restErrors } = currentErrors;
      void place;
      void submit;

      return restErrors;
    });
  };

  const selectPlaceSuggestion = async (suggestion: GooglePlaceSuggestion) => {
    placeDetailsAbortRef.current?.abort();
    const abortController = new AbortController();
    const currentSessionToken = placeSessionToken;

    placeDetailsAbortRef.current = abortController;
    setPlaceSearchInput(suggestion.mainText);
    setPlaceSuggestions([]);
    setPlaceSearchError(null);
    setPlaceDetailsError(null);
    setSelectedPlace(undefined);
    setExistingPlaceMatch(null);
    setIsLoadingPlaceDetails(true);
    clearMapMarkers("review-place");

    try {
      const response = await fetch("/api/google-places/details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          placeId: suggestion.placeId,
          sessionToken: currentSessionToken,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error("お店の詳細情報を取得できませんでした。");
      }

      const data = (await response.json()) as {
        place?: SelectedPlaceInfo;
      };
      const place = data.place;

      if (!place) {
        throw new Error("お店の詳細情報を取得できませんでした。");
      }

      setPlaceSearchInput(place.name);
      setSelectedPlace(place);
      setMapMarkers("review-place", [
        {
          id: place.googlePlaceId,
          position: {
            lat: place.lat,
            lng: place.lng,
          },
          title: place.name,
          variant: NON_GOCHIMESHI_MARKER_VARIANT,
        },
      ]);
      selectMapMarker(place.googlePlaceId);
      setErrors((currentErrors) => {
        const { place, ...restErrors } = currentErrors;
        void place;

        return restErrors;
      });

      const existingPlaceResult = await findPlaceIdByGooglePlaceIdAction(place.googlePlaceId);

      if (abortController.signal.aborted) {
        return;
      }

      if (!existingPlaceResult.success) {
        throw new Error("お店の登録状況を確認できませんでした。");
      }

      if (existingPlaceResult.place) {
        setExistingPlaceMatch(existingPlaceResult.place);
      }
    } catch (error) {
      if (abortController.signal.aborted) {
        return;
      }

      setSelectedPlace(undefined);
      setExistingPlaceMatch(null);
      clearMapMarkers("review-place");
      setPlaceDetailsError(
        error instanceof Error ? error.message : "お店の詳細情報を取得できませんでした。"
      );
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoadingPlaceDetails(false);
      }
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (existingPlaceMatch) {
      newErrors.place = "既存のお店としてレビューしてください。";
    } else if (mode === "new-place" && !hasSelectedPlaceDetails(selectedPlace)) {
      newErrors.place = "お店を選択してください。";
    } else if (mode === "existing-place" && !initialPlace?.id) {
      newErrors.place = "お店を選択してください。";
    }
    if (rating === 0) newErrors.rating = "レートを選択してください。";
    // 価格帯の必須チェック
    if (priceRange === null) newErrors.priceRange = "価格帯を選択してください。";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const confirmExistingPlaceMatch = () => {
    if (!existingPlaceMatch) {
      return;
    }

    onExistingPlaceMatch?.(existingPlaceMatch);
  };

  const onSubmit = async (onSuccess: (placeId: string) => void) => {
    if (!validate()) return;

    setIsPending(true);

    try {
      const reviewInput = {
        rating,
        priceRange,
        comment,
        visitDate: formatDateInput(visitDate),
        tagIds: selectedTags.map((t) => t.id),
      };
      const result =
        mode === "existing-place"
          ? await createReviewForExistingPlaceAction({
              placeId: initialPlace?.id ?? "",
              ...reviewInput,
            })
          : hasSelectedPlaceDetails(selectedPlace)
            ? await createReviewWithPlaceAction({
                place: {
                  googlePlaceId: selectedPlace.googlePlaceId,
                  name: selectedPlace.name,
                  address: selectedPlace.address,
                  lat: selectedPlace.lat,
                  lng: selectedPlace.lng,
                  types: selectedPlace.types,
                  primaryType: selectedPlace.primaryType ?? null,
                  category: selectedPlace.category,
                  imageUrl: selectedPlace.imageUrl ?? null,
                  photoAttributions: selectedPlace.photoAttributions,
                  distanceFromOfficeMeters: selectedPlace.distanceFromOfficeMeters ?? null,
                  walkingDurationSeconds: selectedPlace.walkingDurationSeconds ?? null,
                  sessionToken: selectedPlace.sessionToken,
                  selectionSignature: selectedPlace.selectionSignature,
                },
                ...reviewInput,
              })
            : null;

      if (!result) {
        setErrors((currentErrors) => ({
          ...currentErrors,
          place: "お店を選択してください。",
        }));
        return;
      }

      if (!result.success) {
        setErrors((currentErrors) => ({
          ...currentErrors,
          submit: result.error,
        }));
        return;
      }

      onSuccess(result.placeId);
    } catch {
      setErrors((currentErrors) => ({
        ...currentErrors,
        submit: "レビューの投稿に失敗しました。",
      }));
    } finally {
      setIsPending(false);
    }
  };

  return {
    state: {
      selectedPlace,
      placeSearchInput,
      placeSuggestions,
      isSearchingPlaces,
      placeSearchError,
      isLoadingPlaceDetails,
      placeDetailsError,
      rating,
      comment,
      visitDate,
      errors,
      selectedTags,
      priceRange,
      groupedTags: tagGroups,
      isPending,
      existingPlaceMatch,
      isSubmitDisabled: isPending || Boolean(existingPlaceMatch),
    },
    handlers: {
      setRating,
      setComment,
      setVisitDate,
      setSelectedPlace,
      setPlaceSearch,
      selectPlaceSuggestion,
      clearSelectedPlaceForSearch,
      confirmExistingPlaceMatch,
      handleTagToggle,
      setPriceRange,
      validate,
      onSubmit,
    },
  };
}
