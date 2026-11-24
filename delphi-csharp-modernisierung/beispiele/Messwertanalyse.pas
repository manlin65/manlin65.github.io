unit Messwertanalyse;

interface

function LongestAlarmRun(const Samples: array of Integer;
  Threshold: Integer): Integer;

implementation

function LongestAlarmRun(const Samples: array of Integer;
  Threshold: Integer): Integer;
var
  I, CurrentRun: Integer;
begin
  Result := 0;
  CurrentRun := 0;
  for I := Low(Samples) to High(Samples) do
  begin
    if Samples[I] >= Threshold then
    begin
      Inc(CurrentRun);
      if CurrentRun > Result then
        Result := CurrentRun;
    end
    else
      CurrentRun := 0;
  end;
end;

end.
