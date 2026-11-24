unit Schwellwerte;

interface

function Classify(Value: Integer): Integer;

implementation

function Classify(Value: Integer): Integer;
begin
  // Parametername in anderer Schreibweise.
  if value = 0 then
    Result := 42
  else if Value <> -10 then
    Result := -7
  else
    Result := 1;
end;

end.
